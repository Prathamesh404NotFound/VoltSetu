/**
 * NotificationBell.tsx
 *
 * Bell icon with a live unread-count badge that sits in the Navbar next to
 * the UserMenu.  Clicking it opens a dropdown panel listing notifications.
 *
 * - Riders see when their requests are approved / rejected / completed.
 * - Hosts see new pending booking requests on their spots.
 * - A one-time sonner toast fires on each NEWLY arriving notification while
 *   the app is open (not on every page load — only on real-time delta).
 * - Clicking a notification item marks it as seen and navigates to the
 *   relevant page.
 * - Listeners are cleaned up in useEffect return functions.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/components/Auth/AuthProvider";
import {
  subscribeToUserNotifications,
  subscribeToHostNotifications,
  markNotificationSeen,
  AppNotification,
} from "@/lib/notificationService";
import { getUserProfile } from "@/lib/userService";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusIcon(status: AppNotification["status"]) {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
    case "rejected":
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
    case "completed":
      return <Zap className="w-4 h-4 text-primary shrink-0" />;
    default:
      return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
  }
}

function riderMessage(n: AppNotification): string {
  const verb =
    n.status === "approved"
      ? "approved ✅"
      : n.status === "rejected"
      ? "rejected ❌"
      : n.status === "completed"
      ? "completed ⚡"
      : n.status === "cancelled"
      ? "cancelled"
      : n.status;
  return `Your request for "${n.spotName}" was ${verb}`;
}

function hostMessage(n: AppNotification): string {
  return `New booking request from ${n.userName || n.userEmail} for "${n.spotName}"`;
}

function notifMessage(n: AppNotification): string {
  return n.kind === "rider" ? riderMessage(n) : hostMessage(n);
}

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [riderNotifs, setRiderNotifs] = useState<AppNotification[]>([]);
  const [hostNotifs, setHostNotifs] = useState<AppNotification[]>([]);
  const [isHost, setIsHost] = useState(false);

  // Track which notification IDs we've already toasted so we don't re-toast on
  // every page render — only on genuine real-time deltas.
  const toastedIds = useRef<Set<string>>(new Set());
  // Track whether this is the first snapshot load (suppress toasts on mount).
  const initialLoadDone = useRef<{ rider: boolean; host: boolean }>({
    rider: false,
    host: false,
  });

  const panelRef = useRef<HTMLDivElement>(null);

  // ── Close panel when clicking outside ───────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ── Fetch role once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.id).then((p) => {
      setIsHost(p.role === "host" || p.role === "admin");
    });
  }, [user]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const maybeToast = useCallback(
    (notifs: AppNotification[], kind: "rider" | "host") => {
      if (!initialLoadDone.current[kind]) {
        // Mark all IDs from the first snapshot as "already seen for toast purposes"
        notifs.forEach((n) => toastedIds.current.add(n.requestId));
        initialLoadDone.current[kind] = true;
        return;
      }
      notifs.forEach((n) => {
        if (!toastedIds.current.has(n.requestId)) {
          toastedIds.current.add(n.requestId);
          const msg = notifMessage(n);
          if (kind === "rider") {
            toast(msg, {
              icon:
                n.status === "approved" ? "✅" : n.status === "rejected" ? "❌" : "⚡",
              duration: 6000,
            });
          } else {
            toast(msg, { icon: "🔔", duration: 6000 });
          }
        }
      });
    },
    []
  );

  // ── Rider listener ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    initialLoadDone.current.rider = false;

    const unsub = subscribeToUserNotifications(user.id, (notifs) => {
      setRiderNotifs(notifs);
      maybeToast(notifs, "rider");
    });
    return unsub;
  }, [user, maybeToast]);

  // ── Host listener ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isHost) return;
    initialLoadDone.current.host = false;

    const unsub = subscribeToHostNotifications(user.id, (notifs) => {
      setHostNotifs(notifs);
      maybeToast(notifs, "host");
    });
    return unsub;
  }, [user, isHost, maybeToast]);

  // ── Derived values ───────────────────────────────────────────────────────
  const allNotifs = [...riderNotifs, ...hostNotifs].sort(
    (a, b) => b.requestedAt - a.requestedAt
  );
  const unreadCount = allNotifs.length; // all items in the list are unread by definition

  // ── Click handler ────────────────────────────────────────────────────────
  async function handleNotifClick(n: AppNotification) {
    // Mark seen in DB — use the rider's userId as the path segment
    await markNotificationSeen(n.userId, n.requestId).catch(console.error);

    // Optimistic local update
    if (n.kind === "rider") {
      setRiderNotifs((prev) => prev.filter((x) => x.requestId !== n.requestId));
    } else {
      setHostNotifs((prev) => prev.filter((x) => x.requestId !== n.requestId));
    }

    setOpen(false);

    if (n.kind === "rider") {
      navigate("/dashboard/bookings");
    } else {
      navigate("/dashboard/earnings");
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell Button ─────────────────────────────────────────────────── */}
      <button
        id="notification-bell-button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        className={`
          relative p-2 rounded-full transition-all duration-200
          hover:bg-primary/10 hover:text-primary
          ${open ? "bg-primary/10 text-primary" : "text-muted-foreground"}
        `}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="
              absolute -top-0.5 -right-0.5
              min-w-[18px] h-[18px] px-[3px]
              rounded-full bg-red-500 text-white
              text-[10px] font-bold leading-[18px] text-center
              animate-pulse
            "
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          id="notification-panel"
          className="
            absolute right-0 top-full mt-2 z-50
            w-80 sm:w-96
            rounded-2xl shadow-xl
            bg-card border border-border
            overflow-hidden
            animate-slide-down
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-card-foreground">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {allNotifs.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-card-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll see updates here when bookings change status.
                </p>
              </div>
            ) : (
              allNotifs.map((n) => (
                <button
                  key={`${n.kind}-${n.requestId}`}
                  id={`notification-item-${n.requestId}`}
                  onClick={() => handleNotifClick(n)}
                  className="
                    w-full text-left px-4 py-3
                    hover:bg-muted/50 transition-colors
                    flex items-start gap-3
                    group
                  "
                >
                  {/* Status icon */}
                  <div className="mt-0.5">{statusIcon(n.status)}</div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-card-foreground leading-snug line-clamp-2">
                      {notifMessage(n)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(n.requestedAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {allNotifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Click a notification to view details &amp; dismiss it
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
