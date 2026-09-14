import { database, auth } from "./firebase-services";
import { sanitizeForDb } from "./bookingService";
import { ref, push, set, serverTimestamp, get, update, remove } from "firebase/database";

/**
 * Host identity verification service.
 *
 * Data model:
 *   hostVerifications/{uid}/{verificationId} — a document review case
 *   hostVerificationsIndex/{verificationId}   — flat index so admins can
 *                                              list every open case across users
 *                                              (users cannot read this index)
 *
 * Fields mirror RTDB rules: only the owning user can create/update their own
 * case; admins approve or reject. Trust level flows:
 *   new -> documents_submitted -> pending_review -> verified / rejected
 */

export type VerificationStatus =
  | "new"
  | "documents_submitted"
  | "pending_review"
  | "verified"
  | "rejected";

export interface HostVerificationDocument {
  type: "aadhaar" | "pan" | "electricity_bill" | "photo_id" | "other";
  label: string;
  // Reference to a stored proof — in MVP hosts paste a shareable link; the
  // schema supports an uploaded file URL when file storage is added later.
  proofUrl?: string;
  documentNumber?: string;
  note?: string;
  expiresAt?: number;
}

export interface HostVerificationCase {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  registrationId?: string;
  status: VerificationStatus;
  documents: HostVerificationDocument[];
  adminNote?: string;
  submittedAt?: number;
  reviewedAt?: number;
  reviewedBy?: string;
  createdAt: any;
}

function uidOrThrow() {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in required to manage verification");
  return user;
}

/** Submit or update the host's verification case with their documents. */
export async function submitHostVerification(data: {
  documents: HostVerificationDocument[];
  registrationId?: string;
}) {
  const user = uidOrThrow();

  if (!Array.isArray(data.documents) || data.documents.length === 0) {
    throw new Error("Attach at least one identity document");
  }
  const maxDocs = 8;
  if (data.documents.length > maxDocs) {
    throw new Error(`You may attach up to ${maxDocs} documents`);
  }

  // Validate each document record: type must be known, no empty labels.
  const allowedTypes = ["aadhaar", "pan", "electricity_bill", "photo_id", "other"];
  const clean: HostVerificationDocument[] = data.documents.map((d) => ({
    type: allowedTypes.includes(d?.type) ? (d.type as HostVerificationDocument["type"]) : "other",
    label: (d?.label || d?.type || "Document").slice(0, 80),
    proofUrl: (d?.proofUrl || "").slice(0, 500),
    documentNumber: (d?.documentNumber || "").slice(0, 40),
    note: (d?.note || "").slice(0, 200),
  }));

  const existingCaseId = await findOwnVerificationCase(user.uid);
  if (existingCaseId) {
    // Update the existing case in place so the queue stays one row per host.
    await update(ref(database, `hostVerifications/${user.uid}/${existingCaseId}`),
      sanitizeForDb({
        documents: clean,
        registrationId: data.registrationId || undefined,
        status: "documents_submitted",
        submittedAt: Date.now(),
        updatedAt: serverTimestamp(),
      }));
    await update(ref(database, `hostVerificationsIndex/${existingCaseId}`),
      sanitizeForDb({
        documents: clean,
        registrationId: data.registrationId || undefined,
        status: "documents_submitted",
        submittedAt: Date.now(),
        updatedAt: serverTimestamp(),
      }));
    return { verificationId: existingCaseId, created: false };
  }

  const userCaseRef = ref(database, `hostVerifications/${user.uid}`);
  const newCaseRef = push(userCaseRef);
  const now = Date.now();
  const caseData = sanitizeForDb({
    uid: user.uid,
    userName: user.displayName || "ChargePush Host",
    userEmail: user.email || "",
    userPhone: "",
    registrationId: data.registrationId || undefined,
    status: "documents_submitted",
    documents: clean,
    submittedAt: now,
    createdAt: serverTimestamp(),
  });
  await set(newCaseRef, caseData);
  await set(ref(database, `hostVerificationsIndex/${newCaseRef.key}`), caseData);
  return { verificationId: newCaseRef.key, created: true };
}

/** Get the host's own verification case (or null if none). */
export async function getOwnVerificationCase(uid: string): Promise<HostVerificationCase | null> {
  try {
    const snap = await get(ref(database, `hostVerifications/${uid}`));
    if (!snap.exists()) return null;
    const cases = snap.val();
    const firstKey = Object.keys(cases)[0];
    if (!firstKey) return null;
    return { id: firstKey, ...cases[firstKey] } as HostVerificationCase;
  } catch (error) {
    console.error("Error fetching own verification case:", error);
    throw error;
  }
}

/** Find the host's existing case id (any case, regardless of status). */
export async function findOwnVerificationCase(uid: string): Promise<string | null> {
  try {
    const snap = await get(ref(database, `hostVerifications/${uid}`));
    if (!snap.exists()) return null;
    return Object.keys(snap.val())[0] || null;
  } catch {
    return null;
  }
}

/** Admin: list every verification case across all hosts (flat index). */
export async function getAllVerificationCases(): Promise<HostVerificationCase[]> {
  try {
    const snap = await get(ref(database, "hostVerificationsIndex"));
    if (!snap.exists()) return [];
    const cases = snap.val();
    return Object.keys(cases)
      .map((key) => ({ id: key, ...cases[key] }))
      .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  } catch (error) {
    console.error("Error fetching verification cases:", error);
    throw error;
  }
}

/** Admin: decide on a verification case — approve or reject. */
export async function decideVerificationCase(
  verificationId: string,
  decision: "verified" | "rejected",
  adminNote?: string
) {
  const user = uidOrThrow();

  const indexRef = ref(database, `hostVerificationsIndex/${verificationId}`);
  const indexSnap = await get(indexRef);
  if (!indexSnap.exists()) throw new Error("Verification case not found");
  const existing = indexSnap.val();

  const patch = sanitizeForDb({
    status: decision,
    adminNote: (adminNote || "").slice(0, 300),
    reviewedAt: Date.now(),
    reviewedBy: user.uid,
    updatedAt: serverTimestamp(),
  });

  // Update the flat index AND the per-user record so both stay in sync.
  await update(indexRef, patch);
  await update(ref(database, `hostVerifications/${existing.uid}/${verificationId}`), patch);

  if (decision === "verified") {
    // Promote the host: role stays "host", trust badge flips to verified.
    await update(ref(database, `users/${existing.uid}`), {
      hostStatus: "approved",
      isVerifiedHost: true,
      updatedAt: serverTimestamp(),
    });
    // If the case is tied to a pending registration, approve it too.
    if (existing.registrationId) {
      try {
        const { updateRegistrationStatus } = await import("./hostRegistration");
        await updateRegistrationStatus(existing.registrationId, existing.uid, "approved",
          adminNote || "Verified via document review");
      } catch (error) {
        console.error("Linked registration approval failed:", error);
        // Verification still succeeded; registration can be handled separately.
      }
    }
  } else {
    await update(ref(database, `users/${existing.uid}`), {
      hostStatus: "rejected",
      isVerifiedHost: false,
      updatedAt: serverTimestamp(),
    });
  }
  return true;
}

/** Update the owner's phone on their case (set once on submission via the form). */
export async function setVerificationContactPhone(uid: string, phone: string) {
  const caseId = await findOwnVerificationCase(uid);
  if (!caseId) return;
  const patch = sanitizeForDb({ userPhone: (phone || "").slice(0, 20) });
  await update(ref(database, `hostVerifications/${uid}/${caseId}`), patch);
  await update(ref(database, `hostVerificationsIndex/${caseId}`), patch);
}

/** Remove a whole case (admin only, mirrors rules). */
export async function removeVerificationCase(verificationId: string) {
  const user = uidOrThrow();
  const indexSnap = await get(ref(database, `hostVerificationsIndex/${verificationId}`));
  if (!indexSnap.exists()) return;
  const existing = indexSnap.val();
  await remove(ref(database, `hostVerificationsIndex/${verificationId}`));
  await remove(ref(database, `hostVerifications/${existing.uid}/${verificationId}`));
  void user;
}
