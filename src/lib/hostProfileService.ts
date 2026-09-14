import { database } from "./firebase-services";
import { ref, get } from "firebase/database";

export interface HostProfileSpot {
  id: string;
  name: string;
  address: string;
  city: string;
  spotType?: string;
  pricePerHour: number;
  outletType?: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  status: string;
  amenities?: Array<{ id?: string; name?: string }>;
  chargingSpeed?: string;
  availableHours?: string;
  description?: string;
}

export interface HostProfile {
  hostId: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  isVerified: boolean;
  hostStatus?: string;
  joinedAt: number;
  spots: HostProfileSpot[];
  activeSpotCount: number;
  /** Host reputation — average rider rating across all bookings completed as host. */
  riderRating: { average: number; count: number };
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Build a public host profile: user doc + all charging spots +
 * aggregated rider reputation from riderRatings.
 */
export async function getHostProfile(hostId: string): Promise<HostProfile | null> {
  try {
    const [userSnap, spotsSnap, ratingsSnap] = await Promise.all([
      get(ref(database, `users/${hostId}`)),
      get(ref(database, "chargingSpots")),
      get(ref(database, "riderRatings")),
    ]);

    if (!userSnap.exists() || userSnap.key !== hostId) return null;
    const userData = userSnap.val() ?? {};

    const spots: HostProfileSpot[] = [];
    const allSpots = spotsSnap.exists() ? (spotsSnap.val() as Record<string, unknown>) : {};
    for (const [id, raw] of Object.entries(allSpots)) {
      const spot = raw as Record<string, unknown>;
      if (spot.hostId === hostId) {
        spots.push({
          id,
          name: String(spot.name ?? "Charging Spot"),
          address: String(spot.address ?? ""),
          city: String(spot.city ?? ""),
          spotType: spot.spotType ? String(spot.spotType) : undefined,
          pricePerHour: safeNum(spot.pricePerHour),
          outletType: spot.outletType ? String(spot.outletType) : undefined,
          rating: safeNum(spot.rating),
          reviews: safeNum(spot.reviews),
          isVerified: Boolean(spot.isVerified),
          status: String(spot.status ?? "active"),
          amenities: spot.amenities ? (spot.amenities as Array<{ id?: string; name?: string }>) : undefined,
          chargingSpeed: spot.chargingSpeed ? String(spot.chargingSpeed) : undefined,
          availableHours: spot.availableHours ? String(spot.availableHours) : undefined,
          description: spot.description ? String(spot.description) : undefined,
        });
      }
    }
    spots.sort((a, b) => b.rating - a.rating);

    let riderRating = { average: 0, count: 0 };
    if (ratingsSnap.exists()) {
      const all = ratingsSnap.val() as Record<string, Record<string, unknown>>;
      const received: number[] = [];
      for (const [spotId, byHost] of Object.entries(all)) {
        for (const [riderId, entry] of Object.entries(byHost)) {
          void spotId;
          if (riderId === hostId) {
            const avg = (entry as { average?: unknown }).average;
            const count = (entry as { count?: unknown }).count;
            if (typeof avg === "number" && typeof count === "number") {
              for (let i = 0; i < Math.min(count, 1000); i += 1) received.push(avg);
            }
          }
        }
      }
      if (received.length > 0) {
        const avg = received.reduce((s, v) => s + v, 0) / received.length;
        riderRating = { average: Math.round(avg * 10) / 10, count: received.length };
      }
    }

    const joinedAt = safeNum(userData.createdAt ?? userData.joinedAt ?? 0);

    return {
      hostId,
      displayName: String(userData.displayName ?? "ChargePush Host"),
      photoURL: userData.photoURL ? String(userData.photoURL) : undefined,
      phone: userData.phone ? String(userData.phone) : undefined,
      city: userData.city ? String(userData.city) : undefined,
      isVerified: Boolean(userData.isVerified),
      hostStatus: userData.hostStatus ? String(userData.hostStatus) : undefined,
      joinedAt: joinedAt > 1e11 ? joinedAt : 0,
      spots,
      activeSpotCount: spots.filter((s) => s.status !== "inactive").length,
      riderRating,
    };
  } catch (error) {
    console.error("Error loading host profile:", error);
    return null;
  }
}

/** Aggregate spot reviews rating across all of a host's spots (weighted by review counts). */
export function aggregateHostRating(spots: HostProfileSpot[]): { average: number; totalReviews: number } {
  let total = 0;
  let weight = 0;
  for (const spot of spots) {
    if (spot.rating > 0 && spot.reviews > 0) {
      total += spot.rating * spot.reviews;
      weight += spot.reviews;
    }
  }
  return { average: weight > 0 ? Math.round((total / weight) * 10) / 10 : 0, totalReviews: weight };
}

/**
 * Round 21: rider-facing host reputation summary.
 * Rider ratings live at riderRatings/{spotId}/{hostId}? No — hosts rate riders
 * at riderRatings/{spotId}/{riderId}. But hosts ALSO receive reputation via
 * spot reviews: a host's aggregate spot-review score is already computed by
 * aggregateHostRating. This helper returns the weighted average across the
 * host's own spots, matching what HostProfile.tsx shows.
 */
export async function getHostRatingSummary(hostId: string): Promise<{ average: number; total: number } | null> {
  try {
    const spotsSnap = await get(ref(database, "chargingSpots"));
    if (!spotsSnap.exists()) return { average: 0, total: 0 };
    const all = spotsSnap.val() as Record<string, { hostId?: string; rating?: number; reviews?: number }>;
    return aggregateHostRating(
      Object.entries(all)
        .filter(([, s]) => s.hostId === hostId && s.rating > 0 && s.reviews > 0)
        .map(([id, s]) => ({
          id,
          name: "",
          address: "",
          city: "",
          pricePerHour: 0,
          rating: safeNum(s.rating),
          reviews: safeNum(s.reviews),
          isVerified: false,
          status: "active",
        }))
    );
  } catch {
    return null;
  }
}
