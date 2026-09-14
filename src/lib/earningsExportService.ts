import { database } from "./firebase-services";
import { ref, get } from "firebase/database";
import { getHostSpots, type HostBookingRequest } from "./hostDashboardService";

/**
 * Host earnings export — a tax/record-keeping CSV of every completed session
 * for a host's spots. Read-only; pulls the spotRequests index and resolves
 * spot names from the host's own spot list.
 */

interface ExportRow {
  date: string;
  spotName: string;
  riderName: string;
  riderPhone: string;
  durationMin: number;
  ratePerHour: number;
  amount: number;
  status: string;
  depositAmount: number;
}

function loadRequestsForSpot(spotId: string): Promise<HostBookingRequest[]> {
  return get(ref(database, `spotRequests/${spotId}`)).then((snap) => {
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(
      ([id, r]: [string, unknown]) => ({ id, ...(r as Record<string, unknown>) } as HostBookingRequest)
    );
  });
}

function fmtDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: ExportRow[]): string {
  const header = "Date,Spot,Rider,Phone,Duration (min),Rate ₹/hr,Amount ₹,Status,Deposit ₹";
  return [header, ...rows.map((r) => [
    fmtDate(r.requestedAt_ts),
    esc(r.spotName),
    esc(r.userName),
    esc(r.userPhone),
    r.duration ?? 0,
    r.pricePerHour ?? 0,
    (r.estimatedCost ?? 0).toFixed(2),
    esc(r.status),
    (r.depositAmount ?? 0).toFixed(2),
  ].join(","))].join("\n");
}

export interface ExportStats {
  sessions: number;
  gross: number;
  earliest: string;
  latest: string;
}

/**
 * Build and download a CSV of completed sessions for all of a host's spots.
 * Returns summary stats; the file download is triggered as a side effect.
 */
export async function exportHostEarningsCsv(
  hostUid: string,
  filename = "chargepush-host-earnings.csv"
): Promise<ExportStats> {
  const spots = await getHostSpots(hostUid);
  const requests = (await Promise.all(
    spots.map((s) => loadRequestsForSpot(s.id))
  )).flat();

  const completed = requests.filter((r) => r.status === "completed");
  const rows: ExportRow[] = completed.map((r) => ({
    ...r,
    requestedAt_ts: Number(r.requestedAt) || Number(r.completedAt) || 0,
  }));
  rows.sort((a, b) => a.requestedAt_ts - b.requestedAt_ts);

  const gross = rows.reduce((s, r) => s + Number(r.estimatedCost ?? 0), 0);

  if (rows.length > 0) {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    sessions: rows.length,
    gross: Math.round(gross * 100) / 100,
    earliest: fmtDate(rows[0]?.requestedAt_ts),
    latest: fmtDate(rows[rows.length - 1]?.requestedAt_ts),
  };
}
