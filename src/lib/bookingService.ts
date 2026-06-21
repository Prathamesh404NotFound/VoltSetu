import { database, auth } from "./firebase-services";
import { ref, push, set, get, update, serverTimestamp } from "firebase/database";

export interface BookingRequest {
  id: string;
  spotId: string;
  spotName: string;
  hostName: string;
  hostPhone: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  requestedAt: any;
  duration: number; // minutes
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  message?: string;
  pricePerHour: number;
  estimatedCost: number;
  city: string;
  outletType: string;
}

/** Submit a new booking request */
export async function submitBookingRequest(
  data: Omit<BookingRequest, "id" | "userId" | "userName" | "userEmail" | "requestedAt" | "status">
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Must be logged in to book");

  const requestsRef = ref(database, `chargingRequests/${user.uid}`);
  const newRef = push(requestsRef);
  await set(newRef, {
    ...data,
    userId: user.uid,
    userName: user.displayName || "",
    userEmail: user.email || "",
    requestedAt: serverTimestamp(),
    status: "pending",
  });
  return newRef.key!;
}

/** Get all bookings for the current user, sorted newest first */
export async function getUserBookings(uid: string): Promise<BookingRequest[]> {
  const requestsRef = ref(database, `chargingRequests/${uid}`);
  const snap = await get(requestsRef);
  if (!snap.exists()) return [];

  const raw = snap.val();
  const bookings: BookingRequest[] = Object.keys(raw).map((key) => ({
    id: key,
    ...raw[key],
  }));

  // Sort newest first (serverTimestamp stored as ms or object — handle both)
  return bookings.sort((a, b) => {
    const ta = typeof a.requestedAt === "number" ? a.requestedAt : 0;
    const tb = typeof b.requestedAt === "number" ? b.requestedAt : 0;
    return tb - ta;
  });
}

/** Cancel a pending booking */
export async function cancelBooking(uid: string, bookingId: string): Promise<void> {
  const bookRef = ref(database, `chargingRequests/${uid}/${bookingId}`);
  await update(bookRef, { status: "cancelled", updatedAt: serverTimestamp() });
}

/** Get all requests for a given spot (host view) */
export async function getSpotRequests(spotId: string): Promise<BookingRequest[]> {
  // KNOWN LIMITATION (pre-production): full-table scan of chargingRequests across all
  // users. Does not scale and exposes cross-user data to any client that can call this.
  // Proper fix requires Firebase security rules plus a denormalized index (e.g.
  // spotRequests/{spotId}/{requestId}) — track as a separate task before launch.
  const allRef = ref(database, "chargingRequests");
  const snap = await get(allRef);
  if (!snap.exists()) return [];

  const all = snap.val();
  const result: BookingRequest[] = [];
  for (const uid of Object.keys(all)) {
    for (const reqId of Object.keys(all[uid])) {
      const req = all[uid][reqId];
      if (req.spotId === spotId) result.push({ id: reqId, ...req });
    }
  }
  return result;
}
