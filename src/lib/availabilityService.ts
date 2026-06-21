/**
 * availabilityService.ts
 *
 * Manages the real-time occupied/available state of charging spots.
 *
 * Data lives at a SEPARATE top-level RTDB path — intentionally decoupled from
 * the main `chargingSpots/{spotId}` record so frequent occupancy toggles don't
 * rewrite the large spot document on every change:
 *
 *   spotAvailability/{spotId}
 *     isOccupied : boolean
 *     updatedAt  : ServerTimestamp (ms since epoch when read)
 *     updatedBy  : string  (host uid)
 *
 * NOTE: Client-side ownership check is a first layer only — add Firebase
 * Security Rules to enforce `auth.uid === resourceData.updatedBy` server-side
 * as a follow-up before production.
 */

import { database, auth } from "@/lib/firebase-services";
import {
  ref,
  set,
  get,
  onValue,
  serverTimestamp,
} from "firebase/database";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface SpotAvailability {
  isOccupied: boolean;
  /** Unix ms timestamp — converted from server timestamp on read */
  updatedAt: number | null;
  updatedBy: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Coerce the raw Firebase value into a SpotAvailability or null */
function parseAvailability(raw: unknown): SpotAvailability | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    isOccupied: Boolean(r.isOccupied),
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : null,
    updatedBy: (r.updatedBy as string) ?? "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// setSpotOccupied
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Set live occupancy for a spot.
 *
 * Performs a client-side ownership check first (fetches chargingSpots/{spotId}.hostId
 * and compares against auth.currentUser.uid) as a first layer of defence.
 *
 * @param spotId     Firebase key of the charging spot
 * @param isOccupied true = occupied, false = free
 */
export async function setSpotOccupied(
  spotId: string,
  isOccupied: boolean
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to update spot availability");

  // Client-side ownership check
  const spotRef = ref(database, `chargingSpots/${spotId}`);
  const spotSnap = await get(spotRef);
  if (!spotSnap.exists()) throw new Error("Spot not found");

  const hostId = spotSnap.val()?.hostId as string | undefined;
  if (hostId !== currentUser.uid) {
    throw new Error("You do not own this spot");
  }

  const availRef = ref(database, `spotAvailability/${spotId}`);
  await set(availRef, {
    isOccupied,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.uid,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// subscribeToSpotAvailability
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time availability for a single spot.
 *
 * Callback receives null when no availability record exists yet (brand-new spot).
 * Returns the Firebase unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToSpotAvailability(
  spotId: string,
  callback: (availability: SpotAvailability | null) => void
): () => void {
  const availRef = ref(database, `spotAvailability/${spotId}`);
  return onValue(availRef, (snapshot) => {
    callback(snapshot.exists() ? parseAvailability(snapshot.val()) : null);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// subscribeToAllAvailability
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time availability for ALL spots at once.
 *
 * Opens a single onValue listener on the top-level `spotAvailability` path —
 * much more efficient than one listener per spot when rendering a map with many
 * markers.
 *
 * Callback receives a map of spotId → SpotAvailability (only spots that have
 * an existing record; spots with no record are absent from the map).
 *
 * Returns the Firebase unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToAllAvailability(
  callback: (availabilityMap: Record<string, SpotAvailability>) => void
): () => void {
  const allRef = ref(database, "spotAvailability");
  return onValue(allRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback({});
      return;
    }
    const raw = snapshot.val() as Record<string, unknown>;
    const result: Record<string, SpotAvailability> = {};
    for (const spotId of Object.keys(raw)) {
      const parsed = parseAvailability(raw[spotId]);
      if (parsed) result[spotId] = parsed;
    }
    callback(result);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// formatRelativeTime — no extra dependency needed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a Unix-ms timestamp to a human-readable "X ago" string.
 * Used in the host toggle to show when the state was last updated.
 */
export function formatRelativeTime(tsMs: number | null): string {
  if (!tsMs) return "Unknown";
  const diffMs = Date.now() - tsMs;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}
