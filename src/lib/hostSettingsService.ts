/* VoltSetu host settings (Round 13).
 *
 * RTDB layout: hostSettings/{hostUid} -> {
 *   listingPaused: boolean,
 *   pausedUntil: string? (ISO),
 *   commercial: boolean,                // true for shop/café/office listings
 *   commercialDetails: { type, businessName?, opensAt?, closesAt? }?
 * }
 *
 * When listingPaused is true, rider-facing queries treat the host's spots as
 * hidden (SpotCard filters via shouldShowSpot in findSpots page logic).
 * Pause always respects an optional pausedUntil expiry so holidays can't
 * orphan a listing.
 */
import { get, ref, serverTimestamp, update } from "firebase/database";
import { database } from "./firebase-services";
import { sanitizeForDb } from "./bookingService";

export interface HostSettings {
  listingPaused: boolean;
  pausedUntil?: string | null;
  commercial: boolean;
  commercialDetails?: {
    type?: string;
    businessName?: string;
    opensAt?: string;
    closesAt?: string;
  } | null;
}

export async function getHostSettings(hostUid: string): Promise<HostSettings> {
  const snap = await get(ref(database, `hostSettings/${hostUid}`));
  return (snap.val() as HostSettings) ?? { listingPaused: false, commercial: false };
}

/**
 * Batch-fetch host settings for multiple hosts in parallel (one read per
 * unique hostId, all fired simultaneously). This eliminates the N+1 pattern
 * where the old code called getHostSettings() individually for each host,
 * causing O(N) sequential Firebase round-trips on every FindSpots load.
 *
 * Returns a map of hostId → HostSettings so callers can do O(1) lookups.
 */
export async function getBatchHostSettings(
  hostIds: string[]
): Promise<Record<string, HostSettings>> {
  if (!hostIds.length) return {};
  const uniqueIds = Array.from(new Set(hostIds.filter(Boolean)));
  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const snap = await get(ref(database, `hostSettings/${id}`));
      return [id, (snap.val() as HostSettings) ?? { listingPaused: false, commercial: false }] as const;
    })
  );
  return Object.fromEntries(results);
}

export async function setListingPaused(
  hostUid: string,
  paused: boolean,
  pausedUntil?: string | null
): Promise<void> {
  if (!hostUid) return;
  // Expired pause auto-clears on read; writing false always wins here.
  await update(
    ref(database, `hostSettings/${hostUid}`),
    sanitizeForDb({
      listingPaused: paused,
      pausedUntil: pausedUntil || null,
      updatedAt: serverTimestamp(),
    })
  );
}

export async function setCommercialDetails(
  hostUid: string,
  details: NonNullable<HostSettings["commercialDetails"]>
): Promise<void> {
  if (!hostUid) return;
  await update(
    ref(database, `hostSettings/${hostUid}`),
    sanitizeForDb({
      commercial: true,
      commercialDetails: details,
      updatedAt: serverTimestamp(),
    })
  );
}

/** Rider-side helper: a paused (and unexpired) host's spots stay visible but
 *  marked paused so the host can't receive bookings while away. */
export function isHostPaused(settings: HostSettings | null): boolean {
  if (!settings) return false;
  if (!settings.listingPaused) return false;
  if (settings.pausedUntil) {
    const until = new Date(settings.pausedUntil).getTime();
    if (Number.isFinite(until) && until > 0 && until < Date.now()) return false;
  }
  return true;
}
