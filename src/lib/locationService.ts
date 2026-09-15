/**
 * ChargePush Unified Location Service
 *
 * Provides client-side user location using Browser Geolocation API
 * and Capacitor Geolocation fallback on native devices.
 * Client-side only — user coordinates are never stored on the server without explicit user request.
 */

import { Geolocation as CapacitorGeolocation } from "@capacitor/geolocation";
import { normalizeCoordinates, type NormalizedCoordinates } from "./mapConfig";

export type LocationSource = "browser" | "capacitor" | "cached" | "manual";
export type AccuracyTier = "precise" | "good" | "approximate";

export interface UserLocationResult extends NormalizedCoordinates {
  accuracy: number; // meters
  accuracyTier: AccuracyTier;
  timestamp: number;
  source: LocationSource;
  heading?: number | null;
  error?: string | null;
}

let cachedLocation: UserLocationResult | null = null;
let activeWatchId: number | string | null = null;

function calculateAccuracyTier(accuracyMeters: number): AccuracyTier {
  if (accuracyMeters <= 25) return "precise";
  if (accuracyMeters <= 100) return "good";
  return "approximate";
}

export function getAccuracyLabel(tier: AccuracyTier, accuracyMeters?: number): string {
  switch (tier) {
    case "precise":
      return "Precise location";
    case "good":
      return `Good accuracy (~${Math.round(accuracyMeters ?? 50)}m)`;
    case "approximate":
      return `Approximate location (~${Math.round(accuracyMeters ?? 150)}m)`;
    default:
      return "Location available";
  }
}

/**
 * Gets cached location if recent (< 5 minutes old)
 */
export function getCachedLocation(): UserLocationResult | null {
  if (!cachedLocation) return null;
  const isFresh = Date.now() - cachedLocation.timestamp < 5 * 60 * 1000;
  return isFresh ? cachedLocation : null;
}

/**
 * Primary single-shot location retrieval
 */
export async function getCurrentLocation(options?: {
  timeoutMs?: number;
  enableHighAccuracy?: boolean;
}): Promise<UserLocationResult> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const enableHighAccuracy = options?.enableHighAccuracy ?? true;

  // 1. Try Browser Geolocation API
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy,
          timeout: timeoutMs,
          maximumAge: 10000,
        });
      });

      const normalized = normalizeCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );

      if (normalized) {
        const result: UserLocationResult = {
          lat: normalized.lat,
          lng: normalized.lng,
          accuracy: position.coords.accuracy,
          accuracyTier: calculateAccuracyTier(position.coords.accuracy),
          timestamp: position.timestamp || Date.now(),
          source: "browser",
          heading: position.coords.heading ?? null,
        };
        cachedLocation = result;
        return result;
      }
    } catch (err) {
      console.warn("Browser geolocation failed, trying Capacitor fallback...", err);
    }
  }

  // 2. Try Capacitor Geolocation API
  try {
    const pos = await CapacitorGeolocation.getCurrentPosition({
      enableHighAccuracy,
      timeout: timeoutMs,
      maximumAge: 10000,
    });

    const normalized = normalizeCoordinates(pos.coords.latitude, pos.coords.longitude);
    if (normalized) {
      const result: UserLocationResult = {
        lat: normalized.lat,
        lng: normalized.lng,
        accuracy: pos.coords.accuracy,
        accuracyTier: calculateAccuracyTier(pos.coords.accuracy),
        timestamp: pos.timestamp || Date.now(),
        source: "capacitor",
        heading: pos.coords.heading ?? null,
      };
      cachedLocation = result;
      return result;
    }
  } catch (err) {
    console.warn("Capacitor geolocation failed:", err);
  }

  // 3. Fallback if location is denied/unavailable
  throw new Error("Location permission denied or unavailable.");
}

/**
 * Continuous watch for position updates
 */
export function watchUserLocation(
  onUpdate: (location: UserLocationResult) => void,
  onError?: (err: Error) => void
): () => void {
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const normalized = normalizeCoordinates(pos.coords.latitude, pos.coords.longitude);
        if (normalized) {
          const result: UserLocationResult = {
            lat: normalized.lat,
            lng: normalized.lng,
            accuracy: pos.coords.accuracy,
            accuracyTier: calculateAccuracyTier(pos.coords.accuracy),
            timestamp: pos.timestamp || Date.now(),
            source: "browser",
            heading: pos.coords.heading ?? null,
          };
          cachedLocation = result;
          onUpdate(result);
        }
      },
      (err) => {
        if (onError) onError(new Error(err.message || "Location watch error"));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    activeWatchId = watchId;
    return () => {
      navigator.geolocation.clearWatch(watchId);
      activeWatchId = null;
    };
  }

  return () => {};
}
