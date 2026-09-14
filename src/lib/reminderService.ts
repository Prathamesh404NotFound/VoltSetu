/* VoltSetu booking reminders (Round 14, hardened Round 20).
 *
 * Client-side session reminders: riders schedule a local notification
 * (via the Web Notification API, PWA-friendly) ahead of a booked session.
 *
 * - No backend writes — reminders live in localStorage, so they survive
 *   page reloads, app restarts, and tab closes (unlike pure in-memory timers).
 * - Works offline and in installed PWA/Capacitor app.
 * - Reminders are keyed by booking id, so the same booking can't be
 *   double-scheduled.
 * - Round 20: a periodic "self-heal tick" (every 60s) re-scans stored
 *   reminders and re-arms any that got lost (e.g. app killed before the
 *   timer fired). This is what makes reminders fire even after a restart.
 *
 * Persistence contract (localStorage, client only):
 *   voltsetu:reminders -> { [bookingId]: { id, spotName, scheduledAt, minutesBefore } }
 */

const STORAGE_KEY = "voltsetu:reminders";
const TICK_MS = 60 * 1000;

export interface BookingReminder {
  id: string;
  bookingId: string;
  spotName: string;
  scheduledAt: number; // ms epoch
  minutesBefore: number;
}

export function remindersSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function loadStored(): BookingReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookingReminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(reminders: BookingReminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    /* quota errors are non-fatal */
  }
}

let armedTimers = new Map<string, number>();

/** Arm (or re-arm) all stored reminders after page load. */
export function armAllReminders(): void {
  clearAllArmed();
  loadStored().forEach((r) => armReminder(r));
  startHealTick();
}

function armReminder(r: BookingReminder): void {
  if (armedTimers.has(r.bookingId)) return; // already armed
  const when = r.scheduledAt - r.minutesBefore * 60 * 1000;
  const delay = when - Date.now();
  if (delay <= 0) {
    removeReminder(r.bookingId);
    return;
  }
  const timer = window.setTimeout(() => fireNotification(r), delay);
  armedTimers.set(r.bookingId, timer);
}

/** Round 20: periodic self-heal tick — re-arms reminders lost after app restarts. */
let healInterval: ReturnType<typeof setInterval> | null = null;

function startHealTick(): void {
  if (healInterval) return;
  healInterval = window.setInterval(() => {
    if (armedTimers.size === 0 && loadStored().length > 0) {
      armAllReminders(); // app restarted after storage survived — re-arm everything
    }
    // Also ensure every fresh reminder in storage has a live timer.
    loadStored().forEach((r) => {
      if (!armedTimers.has(r.bookingId)) armReminder(r);
    });
  }, TICK_MS);
}

async function fireNotification(r: BookingReminder): void {
  try {
    if (remindersSupported() && Notification.permission === "granted") {
      new Notification("ChargePush — Charging Session Soon", {
        body: `Your session at ${r.spotName} starts in ${r.minutesBefore} minutes. Don't forget to plug in!`,
        icon: "/favicon.svg",
        tag: `voltsetu-reminder-${r.bookingId}`,
      });
    }
  } catch {
    /* notifications may fail in constrained contexts; reminder still removed */
  } finally {
    removeReminder(r.bookingId);
  }
}

/** Request permission and schedule a reminder. Returns the reminder. */
export async function scheduleReminder(
  bookingId: string,
  spotName: string,
  scheduledAt: number,
  minutesBefore: number
): Promise<{ ok: boolean; message: string }> {
  if (!remindersSupported()) return { ok: false, message: "Reminders aren't supported in this browser." };
  if (scheduledAt - Date.now() <= minutesBefore * 60 * 1000) {
    return { ok: false, message: "That session starts too soon for a reminder." };
  }
  let granted = Notification.permission === "granted";
  if (!granted && Notification.permission !== "denied") {
    try {
      granted = (await Notification.requestPermission()) === "granted";
    } catch {
      granted = false;
    }
  }
  if (!granted) return { ok: false, message: "Notification permission is needed for reminders. Enable notifications in browser settings to try again." };

  const reminders = loadStored().filter((r) => r.bookingId !== bookingId);
  const reminder: BookingReminder = { id: `rem-${bookingId}`, bookingId, spotName, scheduledAt, minutesBefore };
  reminders.push(reminder);
  persist(reminders);
  armReminder(reminder);
  return { ok: true, message: `Reminder set — we'll nudge you ${minutesBefore} min before your session.` };
}

export function removeReminder(bookingId: string): void {
  const timer = armedTimers.get(bookingId);
  if (timer) {
    window.clearTimeout(timer);
    armedTimers.delete(bookingId);
  }
  persist(loadStored().filter((r) => r.bookingId !== bookingId));
}

export function hasReminder(bookingId: string): boolean {
  return loadStored().some((r) => r.bookingId === bookingId);
}

export function getReminders(): BookingReminder[] {
  return loadStored();
}

function clearAllArmed(): void {
  armedTimers.forEach((t) => window.clearTimeout(t));
  armedTimers.clear();
}
