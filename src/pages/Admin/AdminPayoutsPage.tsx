import ResponsiveContainer from "@/components/ui/responsive-container";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  CalendarRange,
  CheckCircle2,
  IndianRupee,
  Loader2,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { get, push, ref, serverTimestamp, update, set } from "firebase/database";
import { Checkbox } from "@/components/ui/checkbox";
import { database } from "@/lib/firebase-services";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getAllPayoutRequests,
  decidePayoutRequest,
  type PayoutRequest as HostPayoutRequest,
} from "@/lib/hostDashboardService";

interface BookingRow {
  id: string;
  spotId: string;
  spotName: string;
  hostId: string;
  hostName: string;
  hostPhone: string;
  userId: string;
  userName: string;
  duration: number;
  pricePerHour: number;
  estimatedCost: number;
  status: string;
  requestedAt: number;
  city: string;
}

interface PayoutRecord {
  id: string;
  hostId: string;
  amount: number;
  status: "paid" | "pending" | "adjusted";
  paidAt?: number;
  createdAt: number;
  note?: string;
}

interface PayoutRequestRow extends HostPayoutRequest {
  hostName?: string;
  hostPhone?: string;
}

interface HostLedger {
  hostId: string;
  hostName: string;
  hostPhone: string;
  spots: Set<string>;
  spotCount: number;
  completedBookings: number;
  billableMinutes: number;
  grossEarnings: number;
  paidOut: number;
  pendingPayout: number;
  payouts: PayoutRecord[];
}

function asNumber(ts: unknown): number {
  if (typeof ts === "number") return ts;
  if (ts && typeof ts === "object" && "valueOf" in (ts as object)) {
    const v = (ts as { valueOf?: () => unknown }).valueOf?.();
    if (typeof v === "number") return v;
  }
  return 0;
}

export default function AdminPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [requests, setRequests] = useState<PayoutRequestRow[]>([]);
  const [filter, setFilter] = useState<"all" | "due" | "cleared">("all");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNote, setBulkNote] = useState("");
  const [bulkDeciding, setBulkDeciding] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [spotsSnap, requestsSnap, payoutsSnap, requestsList] = await Promise.all([
        get(ref(database, "chargingSpots")),
        get(ref(database, "chargingRequests")),
        get(ref(database, "payouts")),
        getAllPayoutRequests(),
      ]);

      const spotMap = new Map<string, { hostId: string; hostName: string; hostPhone: string; name: string; city: string }>();
      if (spotsSnap.exists()) {
        Object.keys(spotsSnap.val()).forEach((id) => {
          const s = spotsSnap.val()[id];
          spotMap.set(id, {
            hostId: s.hostId,
            hostName: s.hostName || "",
            hostPhone: s.hostPhone || "",
            name: s.name || "",
            city: s.city || "",
          });
        });
      }

      const rows: BookingRow[] = [];
      if (requestsSnap.exists()) {
        Object.keys(requestsSnap.val()).forEach((uid) => {
          Object.keys(requestsSnap.val()[uid]).forEach((bid) => {
            const b = requestsSnap.val()[uid][bid];
            const spot = spotMap.get(b.spotId);
            rows.push({
              id: bid,
              spotId: b.spotId || "",
              spotName: b.spotName || spot?.name || "Unknown spot",
              hostId: spot?.hostId || "",
              hostName: b.hostName || spot?.hostName || "Unknown host",
              hostPhone: spot?.hostPhone || b.hostPhone || "",
              userId: uid,
              userName: b.userName || "Rider",
              duration: Number(b.duration) || 0,
              pricePerHour: Number(b.pricePerHour) || 0,
              estimatedCost: Number(b.estimatedCost) || 0,
              status: b.status || "pending",
              requestedAt: asNumber(b.requestedAt),
              city: b.city || spot?.city || "",
            });
          });
        });
      }

      const payoutRows: PayoutRecord[] = [];
      if (payoutsSnap.exists()) {
        Object.keys(payoutsSnap.val()).forEach((hostId) => {
          Object.keys(payoutsSnap.val()[hostId]).forEach((pid) => {
            const p = payoutsSnap.val()[hostId][pid];
            payoutRows.push({
              id: pid,
              hostId,
              amount: Number(p.amount) || 0,
              status: p.status || "pending",
              paidAt: asNumber(p.paidAt),
              createdAt: asNumber(p.createdAt),
              note: typeof p.note === "string" ? p.note : undefined,
            });
          });
        });
      }

      const enrichedRequests: PayoutRequestRow[] = requestsList.map((r) => {
        const match = Object.values(spotsSnap.exists() ? spotsSnap.val() : {})?.find?.(
          (s: any) => s.hostId === r.hostId
        ) as { hostName?: string; hostPhone?: string } | undefined;
        return {
          ...r,
          hostName: match?.hostName || "Host",
          hostPhone: match?.hostPhone || "",
        };
      });

      setBookings(rows);
      setPayouts(payoutRows);
      setRequests(enrichedRequests);
    } catch (error) {
      console.error("Failed to load payout data:", error);
      toast.error("Could not load payout data. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const ledgers = useMemo(() => {
    const map = new Map<string, HostLedger>();
    bookings.forEach((b) => {
      if (!b.hostId || !b.spotId) return;
      const ledger =
        map.get(b.hostId) ||
        {
          hostId: b.hostId,
          hostName: b.hostName,
          hostPhone: b.hostPhone,
          spots: new Set<string>(),
          spotCount: 0,
          completedBookings: 0,
          billableMinutes: 0,
          grossEarnings: 0,
          paidOut: 0,
          pendingPayout: 0,
          payouts: [],
        };
      ledger.spots.add(b.spotId);
      ledger.spotCount = ledger.spots.size;
      if (b.status === "completed" || b.status === "approved") {
        ledger.completedBookings += 1;
        ledger.billableMinutes += b.duration;
        ledger.grossEarnings +=
          b.estimatedCost > 0 ? b.estimatedCost : (b.pricePerHour * b.duration) / 60;
      }
      map.set(b.hostId, ledger);
    });
    payouts.forEach((p) => {
      const ledger =
        map.get(p.hostId) ||
        {
          hostId: p.hostId,
          hostName: "Host (no bookings)",
          hostPhone: "",
          spots: new Set<string>(),
          spotCount: 0,
          completedBookings: 0,
          billableMinutes: 0,
          grossEarnings: 0,
          paidOut: 0,
          pendingPayout: 0,
          payouts: [],
        };
      if (p.status === "paid") ledger.paidOut += p.amount;
      else ledger.pendingPayout += p.amount;
      ledger.payouts.push(p);
      map.set(p.hostId, ledger);
    });

    return Array.from(map.values()).sort((a, b) => b.grossEarnings - a.grossEarnings);
  }, [bookings, payouts]);

  const filtered = useMemo(() => {
    if (filter === "due") return ledgers.filter((l) => l.pendingPayout > 0);
    if (filter === "cleared") return ledgers.filter((l) => l.pendingPayout === 0 && l.grossEarnings > 0);
    return ledgers;
  }, [ledgers, filter]);

  const totals = useMemo(
    () => ({
      hosts: ledgers.length,
      gross: ledgers.reduce((acc, l) => acc + l.grossEarnings, 0),
      pending: ledgers.reduce((acc, l) => acc + l.pendingPayout, 0),
      paid: ledgers.reduce((acc, l) => acc + l.paidOut, 0),
      openRequests: requests.filter((r) => r.status === "pending" || r.status === "processing").length,
    }),
    [ledgers, requests]
  );

  const activeRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "processing"
  );
  const closedRequests = requests.filter(
    (r) => r.status === "paid" || r.status === "rejected"
  );

  const allSelected =
    activeRequests.length > 0 && activeRequests.every((r) => selectedIds.has(r.id));

  function toggleAll(selected: boolean) {
    setSelectedIds(
      selected ? new Set(activeRequests.map((r) => r.id)) : new Set()
    );
  }

  function toggleOne(id: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function bulkDecide(decision: "paid" | "rejected") {
    const ids = [...selectedIds].filter((id) =>
      activeRequests.some((r) => r.id === id)
    );
    if (ids.length === 0) {
      toast.warning("Select at least one payout request first.");
      return;
    }
    if (decision === "rejected" && !bulkNote.trim()) {
      toast.warning("Add one shared rejection note so every host sees what went wrong.");
      return;
    }
    setBulkDeciding(true);
    let ok = 0;
    for (const id of ids) {
      const req = activeRequests.find((r) => r.id === id);
      if (!req || !req.hostId) continue;
      try {
        await decidePayoutRequest(
          req.hostId,
          req.id,
          decision,
          decision === "paid"
            ? "Approved via ChargePush admin payout queue (bulk)"
            : bulkNote.trim()
        );
        ok += 1;
      } catch {
        toast.error(`Could not process request from ${req.hostName}`);
      }
    }
    toast.success(
      decision === "paid"
        ? `Approved ${ok} payout request${ok === 1 ? "" : "s"}`
        : `Rejected ${ok} payout request${ok === 1 ? "" : "s"}`
    );
    setBulkNote("");
    setSelectedIds(new Set());
    setBulkDeciding(false);
    await loadData();
  }

  async function markPaid(hostId: string, hostName: string, amount: number) {
    if (amount <= 0) {
      toast.error("Nothing due for this host right now.");
      return;
    }
    try {
      const payoutRef = push(ref(database, `payouts/${hostId}`));
      await set(payoutRef, {
        hostId,
        amount: Math.round(amount * 100) / 100,
        status: "paid",
        paidAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        note: "Marked paid from ChargePush admin workspace",
      });
      toast.success(`Payout of ₹${amount.toFixed(2)} recorded for ${hostName}`);
      await loadData();
    } catch (error) {
      console.error("Payout write failed:", error);
      toast.error("Could not record payout. Please retry.");
    }
  }

  async function handleDecision(
    req: PayoutRequestRow,
    decision: "paid" | "rejected"
  ) {
    if (!req.hostId) {
      toast.error("This request is missing its host reference.");
      return;
    }
    setDecidingId(req.id);
    try {
      await decidePayoutRequest(
        req.hostId,
        req.id,
        decision,
        decision === "paid"
          ? "Approved via ChargePush admin payout queue"
          : "Rejected via ChargePush admin payout queue"
      );
      toast.success(
        decision === "paid"
          ? `Payout of ₹${req.amount.toFixed(2)} approved for ${req.hostName}`
          : `Payout request of ₹${req.amount.toFixed(2)} rejected.`
      );
      await loadData();
    } catch (error) {
      console.error("Payout decision failed:", error);
      toast.error("Could not process that request. Please retry.");
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <ResponsiveContainer size="xl" className="py-6">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Payout Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Host earnings computed from approved and completed booking sessions (pricePerHour × duration).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {loading ? "Syncing…" : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Hosts in ledger", value: String(totals.hosts), icon: Users },
          { label: "Gross host earnings", value: `₹${totals.gross.toFixed(2)}`, icon: IndianRupee },
          { label: "Pending payout", value: `₹${totals.pending.toFixed(2)}`, icon: ReceiptText },
          { label: "Already paid", value: `₹${totals.paid.toFixed(2)}`, icon: CheckCircle2 },
          { label: "Open payout requests", value: String(totals.openRequests), icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "due", "cleared"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All hosts" : f === "due" ? "Payment due" : "Cleared"}
          </button>
        ))}
      </div>

      {/* Host-initiated payout requests queue */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Payout Requests</h2>
          <span className="ml-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {activeRequests.length} open
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Hosts request withdrawals from their due balance. Approve to pay and record the ledger entry,
          or reject to send it back.
        </p>
        {activeRequests.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 py-8 text-center text-sm text-muted-foreground">
            No payout requests waiting — hosts haven't asked to withdraw yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {/* Bulk action toolbar */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all payout requests"
                />
                Select all
              </label>
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <input
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value.slice(0, 200))}
                  placeholder="Shared rejection note…"
                  maxLength={200}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs w-56 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  size="sm"
                  className="gap-1.5 bg-ev-green hover:bg-ev-green/90 text-white"
                  disabled={bulkDeciding || selectedIds.size === 0}
                  onClick={() => bulkDecide("paid")}
                >
                  {bulkDeciding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Approve {selectedIds.size > 0 ? `${selectedIds.size}` : ""}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={bulkDeciding || selectedIds.size === 0}
                  onClick={() => bulkDecide("rejected")}
                >
                  {bulkDeciding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Reject {selectedIds.size > 0 ? `${selectedIds.size}` : ""}
                </Button>
              </div>
            </div>
            {activeRequests.map((req) => (
              <div key={req.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-4">
                <Checkbox
                  checked={selectedIds.has(req.id)}
                  onCheckedChange={(v) => toggleOne(req.id, v === true)}
                  aria-label={`Select payout request from ${req.hostName}`}
                />
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-semibold text-foreground">{req.hostName}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.hostPhone || "No phone on file"}{req.upiId ? ` · ${req.upiId}` : " · no UPI provided"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground">₹{req.amount.toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(req.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-ev-green hover:bg-ev-green/90 text-white"
                    disabled={decidingId === req.id}
                    onClick={() => handleDecision(req, "paid")}
                  >
                    {decidingId === req.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                    disabled={decidingId === req.id}
                    onClick={() => handleDecision(req, "rejected")}
                  >
                    {decidingId === req.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {closedRequests.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              {closedRequests.length} processed request{closedRequests.length === 1 ? "" : "s"} (paid or rejected)
            </summary>
            <div className="mt-2 space-y-1.5">
              {closedRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    {req.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 text-ev-green">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <XCircle className="h-3 w-3" /> Rejected
                      </span>
                    )}
                    <span className="ml-2 font-medium text-foreground">{req.hostName}</span>
                    <span className="ml-1.5">· ₹{req.amount.toFixed(2)}</span>
                    {req.upiId ? <span className="ml-1.5">· {req.upiId}</span> : null}
                    <span className="ml-1.5">
                      · {req.paidAt ? new Date(req.paidAt).toLocaleString("en-IN") : new Date(req.createdAt).toLocaleString("en-IN")}
                    </span>
                  </span>
                  {req.note ? <span className="max-w-[40%] truncate text-muted-foreground/70">{req.note}</span> : null}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading payout ledger…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 py-16 text-center text-muted-foreground">
          <ArrowDownToLine className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p className="font-medium">
            {filter === "all"
              ? "No payout activity yet — earnings appear here once bookings are approved or completed."
              : filter === "due"
              ? "All hosts are clear. No pending payouts."
              : "No fully cleared hosts yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ledger) => (
            <div key={ledger.hostId} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{ledger.hostName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {ledger.hostPhone || "No phone on file"} · {ledger.spotCount} spot
                    {ledger.spotCount === 1 ? "" : "s"} · {ledger.city ? `${ledger.city}, ` : ""}
                    {ledger.completedBookings} approved/completed session
                    {ledger.completedBookings === 1 ? "" : "s"} · {Math.round(ledger.billableMinutes / 60 * 10) / 10}h
                    billed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Gross earnings</p>
                  <p className="text-xl font-bold text-foreground">₹{ledger.grossEarnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Paid out: <strong className="text-foreground">₹{ledger.paidOut.toFixed(2)}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  Due now:{" "}
                  <strong className={ledger.pendingPayout > 0 ? "text-ev-green" : "text-foreground"}>
                    ₹{ledger.pendingPayout.toFixed(2)}
                  </strong>
                </span>
                <span className="ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={ledger.pendingPayout <= 0}
                    onClick={() => markPaid(ledger.hostId, ledger.hostName, ledger.pendingPayout)}
                  >
                    <CalendarRange className="h-4 w-4" />
                    Mark Paid ₹{ledger.pendingPayout.toFixed(2)}
                  </Button>
                </span>
              </div>

              {ledger.payouts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {ledger.payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-xs">
                      <span className="text-muted-foreground">
                        {p.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 text-ev-green">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <ReceiptText className="h-3 w-3" /> Pending
                          </span>
                        )}
                        <span className="ml-2">₹{p.amount.toFixed(2)}</span>
                        <span className="ml-2">
                          {p.paidAt
                            ? new Date(p.paidAt).toLocaleString()
                            : `created ${new Date(p.createdAt).toLocaleString()}`}
                        </span>
                      </span>
                      {p.note && <span className="max-w-[45%] truncate text-muted-foreground/70">{p.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ResponsiveContainer>
  );
}
