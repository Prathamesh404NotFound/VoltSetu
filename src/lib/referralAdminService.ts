/* VoltSetu admin referral dashboard (Round 14).
 *
 * Aggregates everything needed to audit the referral program:
 *  - referralCodes/{code}      -> { hostUid, hostName, createdAt }
 *  - referralClaims/{uid}      -> { code, claimedAt }
 *  - users/{uid}               -> referralCredits, referredCount
 *
 * The admin page is purely read-only; credits adjustments are a future
 * controlled action (never exposed here) to avoid money movement bugs.
 */
import { get, ref } from "firebase/database";
import { database } from "./firebase-services";

export interface AdminReferralCode {
  code: string;
  hostUid: string;
  hostName: string;
  createdAt: any;
  credits: number;
  referredCount: number;
  claims: { claimedByUid: string; claimedAt: any }[];
}

export interface AdminReferralSnapshot {
  codes: AdminReferralCode[];
  totalCreditsIssued: number;
  totalClaims: number;
  totalReferrals: number;
}

/** Aggregate the full referral picture for the admin workspace. */
export async function getAdminReferrals(): Promise<AdminReferralSnapshot> {
  const codesSnap = await get(ref(database, "referralCodes")).catch(() => null);
  const claimsSnap = await get(ref(database, "referralClaims")).catch(() => null);

  // Build a claim lookup: code -> list of claim events
  const claimsByCode = new Map<string, { claimedByUid: string; claimedAt: any }[]>();
  claimsSnap?.forEach((child) => {
    const claim = child.val() as { code?: string; claimedAt?: any };
    if (claim?.code) {
      const list = claimsByCode.get(claim.code) ?? [];
      list.push({ claimedByUid: child.key!, claimedAt: claim.claimedAt });
      claimsByCode.set(claim.code, list);
    }
  });

  const codes: AdminReferralCode[] = [];
  codesSnap?.forEach((child) => {
    const meta = child.val() as { hostUid?: string; hostName?: string; createdAt?: any };
    if (!meta?.hostUid) return;
    codes.push({
      code: child.key!,
      hostUid: meta.hostUid,
      hostName: meta.hostName || "ChargePush Host",
      createdAt: meta.createdAt,
      credits: 0,
      referredCount: 0,
      claims: claimsByCode.get(child.key!) ?? [],
    });
  });

  // Fetch credits/referredCount for each host concurrently
  await Promise.all(
    codes.map(async (c) => {
      try {
        const [creditsSnap, countSnap] = await Promise.all([
          get(ref(database, `users/${c.hostUid}/referralCredits`)),
          get(ref(database, `users/${c.hostUid}/referredCount`)),
        ]);
        c.credits = Number(creditsSnap.val() ?? 0);
        c.referredCount = Number(countSnap.val() ?? 0);
      } catch {
        c.credits = 0;
        c.referredCount = 0;
      }
    })
  );

  codes.sort((a, b) => b.credits - a.credits);

  const totalCreditsIssued = codes.reduce((sum, c) => sum + c.credits, 0);
  const totalClaims = claimsSnap ? Object.keys(claimsSnap.val() ?? {}).length : 0;
  const totalReferrals = codes.reduce((sum, c) => sum + c.referredCount, 0);

  return { codes, totalCreditsIssued, totalClaims, totalReferrals };
}
