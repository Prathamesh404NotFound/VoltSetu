/**
 * notificationService.ts
 *
 * Lightweight in-app notification service built on Firebase Realtime Database onValue
 * listeners.  NO push notifications / service worker required.
 *
 * Data model
 * ----------
 * Rider notifications live at:   chargingRequests/{uid}/{requestId}
 *   - A request with status !== "pending" AND seen !== true is "unread" for the rider.
 *
 * Host notifications are derived from the same tree by filtering all requests
 * whose spotId matches one of the host's own spots.
 *
 * The `seen` flag is written back to:  chargingRequests/{uid}/{requestId}/seen
 */

import { database } from "@/lib/firebase-services";
import { ref, onValue, update, get } from "firebase/database";
import type { BookingRequest } from "@/lib/bookingService";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface AppNotification {
  /** Firebase request key */
  requestId: string;
  /** uid of the rider who made the request */
  userId: string;
  spotId: string;
  spotName: string;
  /** Name of the rider (useful for host-side display) */
  userName: string;
  userEmail: string;
  status: BookingRequest["status"];
  requestedAt: number;
  seen: boolean;
  /** "rider" — status changed away from pending; "host" — new pending request */
  kind: "rider" | "host";
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse the flat record stored at chargingRequests/{uid}/{requestId} */
function parseRequest(
  uid: string,
  requestId: string,
  raw: Record<string, unknown>
): BookingRequest & { seen?: boolean } {
  return {
    id: requestId,
    userId: (raw.userId as string) ?? uid,
    spotId: (raw.spotId as string) ?? "",
    spotName: (raw.spotName as string) ?? "",
    hostName: (raw.hostName as string) ?? "",
    hostPhone: (raw.hostPhone as string) ?? "",
    userName: (raw.userName as string) ?? "",
    userPhone: (raw.userPhone as string) ?? "",
    userEmail: (raw.userEmail as string) ?? "",
    requestedAt: raw.requestedAt as any,
    duration: (raw.duration as number) ?? 0,
    status: (raw.status as BookingRequest["status"]) ?? "pending",
    message: raw.message as string | undefined,
    pricePerHour: (raw.pricePerHour as number) ?? 0,
    estimatedCost: (raw.estimatedCost as number) ?? 0,
    city: (raw.city as string) ?? "",
    outletType: (raw.outletType as string) ?? "",
    seen: (raw.seen as boolean) ?? false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// subscribeToUserNotifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to rider (user) notifications.
 *
 * Fires callback whenever chargingRequests/{uid} changes.
 * An "unread" notification = a request whose status !== "pending" AND seen !== true.
 *
 * @returns unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToUserNotifications(
  uid: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  const requestsRef = ref(database, `chargingRequests/${uid}`);

  const unsub = onValue(requestsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const raw = snapshot.val() as Record<string, Record<string, unknown>>;
    const notifications: AppNotification[] = [];

    for (const requestId of Object.keys(raw)) {
      const req = parseRequest(uid, requestId, raw[requestId]);

      // Only surface requests that have moved past "pending" and are unseen
      if (req.status !== "pending" && !req.seen) {
        notifications.push({
          requestId,
          userId: req.userId,
          spotId: req.spotId,
          spotName: req.spotName,
          userName: req.userName,
          userEmail: req.userEmail,
          status: req.status,
          requestedAt:
            typeof req.requestedAt === "number" ? req.requestedAt : Date.now(),
          seen: false,
          kind: "rider",
        });
      }
    }

    // Newest first
    notifications.sort((a, b) => b.requestedAt - a.requestedAt);
    callback(notifications);
  });

  return unsub;
}

// ─────────────────────────────────────────────────────────────────────────────
// subscribeToHostNotifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to host notifications.
 *
 * Fires callback whenever any new PENDING request appears on one of the host's spots.
 * Strategy:
 *  1. Read host's spot IDs once from chargingSpots (one-time get).
 *  2. Listen on the full chargingRequests tree and filter client-side.
 *
 * "Unread" for a host = a request with status "pending" AND seen !== true.
 *
 * @returns unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToHostNotifications(
  hostUid: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  // One-time fetch of this host's spot IDs, then attach onValue listener
  const spotsRef = ref(database, "chargingSpots");
  get(spotsRef).then((spotsSnap) => {
    if (cancelled) return;

    const hostSpotIds = new Set<string>();
    if (spotsSnap.exists()) {
      const spots = spotsSnap.val() as Record<string, Record<string, unknown>>;
      for (const [spotId, spot] of Object.entries(spots)) {
        if (spot.hostId === hostUid) hostSpotIds.add(spotId);
      }
    }

    if (hostSpotIds.size === 0) {
      callback([]);
      return;
    }

    const allRequestsRef = ref(database, "chargingRequests");
    unsub = onValue(allRequestsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const allUsers = snapshot.val() as Record<
        string,
        Record<string, Record<string, unknown>>
      >;
      const notifications: AppNotification[] = [];

      for (const uid of Object.keys(allUsers)) {
        const userReqs = allUsers[uid];
        if (!userReqs || typeof userReqs !== "object") continue;

        for (const requestId of Object.keys(userReqs)) {
          const req = parseRequest(uid, requestId, userReqs[requestId]);

          if (!hostSpotIds.has(req.spotId)) continue;

          // Host sees: pending requests that haven't been seen yet
          if (req.status === "pending" && !req.seen) {
            notifications.push({
              requestId,
              userId: req.userId,
              spotId: req.spotId,
              spotName: req.spotName,
              userName: req.userName,
              userEmail: req.userEmail,
              status: req.status,
              requestedAt:
                typeof req.requestedAt === "number"
                  ? req.requestedAt
                  : Date.now(),
              seen: false,
              kind: "host",
            });
          }
        }
      }

      notifications.sort((a, b) => b.requestedAt - a.requestedAt);
      callback(notifications);
    });
  });

  // Return a cleanup that cancels the pending get AND unsubscribes onValue when ready
  return () => {
    cancelled = true;
    unsub?.();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// markNotificationSeen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a specific request as seen so it no longer appears in the bell badge.
 * Works for both rider notifications (where uid === riderUid) and host
 * notifications (where uid = the rider's uid, stored in notification.userId).
 */
export async function markNotificationSeen(
  uid: string,
  requestId: string
): Promise<void> {
  const requestRef = ref(database, `chargingRequests/${uid}/${requestId}`);
  await update(requestRef, { seen: true });
}
