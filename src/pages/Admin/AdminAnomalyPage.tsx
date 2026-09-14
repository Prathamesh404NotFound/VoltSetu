/* ChargePush admin anomaly / fraud detector.
 *
 * Client-side read-only analysis of the whole booking + referral dataset.
 * RTDB paths: chargingRequests/{userId}/{requestId}, referralClaims/{uid}
 * {code, claimedAt}, referralCodes/{code} {hostUid}, users/{uid}.
 *
 * Rules (severity):
 *  1. Rapid-fire bookings — a rider firing ≥5 requests in 24h (medium)
 *  2. Frequent cancellations — ≥3 cancelled/rejected requests in 7 days (medium)
 *  3. Repeat booking pattern — ≥4 requests to the same spot in 30 days (low)
 *  4. Self-referral — a host claiming their own referral code (high)
 *  5. Referral burst — one code claimed ≥3 times in 24h (medium)
 */
import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, AlertTriangle, Info, TrendingUp, Flame, UserX, Users, Search, RefreshCw } from "lucide-react";
import { get, ref } from "firebase/database";
import { database } from "@/lib/firebase-services";
import ResponsiveContainer from "@/components/ui/responsive-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Severity = "high" | "medium" | "low";

interface Flag {
  id: string;
  rule: string;
  severity: Severity;
  subject: string;
  detail: string;
  count: number;
}

interface RawRequest {
  id: string;
  userId: string;
  spotId?: string;
  spotName?: string;
  hostId?: string;
  status?: string;
  requestedAt?: number;
  emergency?: boolean;
}

interface Claim {
  claimedByUid: string;
  claimedAt?: number;
  code?: string;
}

interface CodeMeta {
  code: string;
  hostUid?: string;
  hostName?: string;
}

const DAY = 24 * 60 * 60 * 1000;

const SEVERITY_META: Record<Severity, { label: string; cls: string; icon: typeof AlertTriangle }> = {
  high: { label: "High", cls: "bg-red-500/15 text-red-400 border-red-500/40", icon: Flame },
  medium: { label: "Medium", cls: "bg-amber-500/15 text-amber-400 border-amber-500/40", icon: AlertTriangle },
  low: { label: "Low", cls: "bg-blue-500/15 text-blue-400 border-blue-500/40", icon: Info },
};

function flattenRequests(all: Record<string, Record<string, unknown>> | null): RawRequest[] {
  if (!all) return [];
  const out: RawRequest[] = [];
  for (const [userId, userReqs] of Object.entries(all)) {
    if (!userReqs || typeof userReqs !== "object") continue;
    for (const [requestId, req] of Object.entries(userReqs as Record<string, unknown>)) {
      if (!req || typeof req !== "object") continue;
      out.push({ id: requestId, userId, ...(req as Record<string, unknown>) } as RawRequest);
    }
  }
  return out;
}

export default function AdminAnomalyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RawRequest[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [codes, setCodes] = useState<CodeMeta[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      get(ref(database, "chargingRequests")).catch(() => null),
      get(ref(database, "referralClaims")).catch(() => null),
      get(ref(database, "referralCodes")).catch(() => null),
    ])
      .then(([reqSnap, claimsSnap, codesSnap]) => {
        if (!alive) return;
        setRequests(flattenRequests(reqSnap?.exists() ? (reqSnap.val() as Record<string, Record<string, unknown>>) : null));
        const claimList: Claim[] = [];
        claimsSnap?.forEach((child) => {
          const c = child.val() as { claimedAt?: number; code?: string };
          claimList.push({ claimedByUid: child.key!, claimedAt: c?.claimedAt, code: c?.code });
        });
        setClaims(claimList);
        const codeList: CodeMeta[] = [];
        codesSnap?.forEach((child) => {
          const m = child.val() as { hostUid?: string; hostName?: string };
          if (m?.hostUid) codeList.push({ code: child.key!, hostUid: m.hostUid, hostName: m.hostName });
        });
        setCodes(codeList);
      })
      .catch((e) => setError(e?.message || "Failed to load data"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const flags = useMemo<Flag[]>(() => {
    const now = Date.now();
    const list: Flag[] = [];
    const byUser = new Map<string, RawRequest[]>();
    requests.forEach((r) => {
      const arr = byUser.get(r.userId) ?? [];
      arr.push(r);
      byUser.set(r.userId, arr);
    });

    // Rule 1 — rapid-fire bookings (>=5 requests in any rolling 24h window)
    for (const [userId, reqs] of byUser.entries()) {
      const sorted = [...reqs].sort((a, b) => (a.requestedAt ?? 0) - (b.requestedAt ?? 0));
      for (let i = 0; i < sorted.length; i++) {
        const start = sorted[i].requestedAt ?? 0;
        const inWindow = sorted.slice(i).filter((r) => (r.requestedAt ?? 0) - start < DAY).length;
        if (inWindow >= 5) {
          list.push({
            id: `rapid:${userId}`,
            rule: "Rapid-fire bookings",
            severity: "medium",
            subject: userId.slice(0, 10),
            detail: `${inWindow} bookings in 24h — possible scalping, testing abuse, or script usage.`,
            count: inWindow,
          });
          break;
        }
      }
    }

    // Rule 2 — frequent cancellations (>=3 cancelled/rejected in 7 days)
    for (const [userId, reqs] of byUser.entries()) {
      const cancels = reqs.filter(
        (r) => ["cancelled", "canceled", "rejected"].includes(String(r.status ?? "").toLowerCase()) && (r.requestedAt ?? 0) > now - 7 * DAY
      );
      if (cancels.length >= 3) {
        list.push({
          id: `cancel:${userId}`,
          rule: "Frequent cancellations",
          severity: "medium",
          subject: userId.slice(0, 10),
          detail: `${cancels.length} cancelled/rejected in 7 days — rider may be reserving slots to block others.`,
          count: cancels.length,
        });
      }
    }

    // Rule 3 — same rider, same spot, repeat pattern (>=4 in 30 days)
    const riderSpot = new Map<string, RawRequest[]>();
    requests.forEach((r) => {
      if (!r.spotId) return;
      const key = `${r.userId}::${r.spotId}`;
      const arr = riderSpot.get(key) ?? [];
      arr.push(r);
      riderSpot.set(key, arr);
    });
    const flaggedPairs = new Set<string>();
    for (const [key, reqs] of riderSpot.entries()) {
      const recent = reqs.filter((r) => (r.requestedAt ?? 0) > now - 30 * DAY);
      if (recent.length >= 4 && !flaggedPairs.has(key)) {
        flaggedPairs.add(key);
        const [userId, spotId] = key.split("::");
        list.push({
          id: `repeat:${key}`,
          rule: "Repeat booking pattern",
          severity: "low",
          subject: userId.slice(0, 10),
          detail: `${recent.length} requests to spot ${spotId.slice(0, 8)} in 30 days — likely a regular commuter; monitor before acting.`,
          count: recent.length,
        });
      }
    }

    // Rule 4 — self-referral (host claims their own code, or a claim's uid is a host uid of the same code)
    const codeByUid = new Map(codes.map((c) => [c.hostUid!, c]));
    for (const claim of claims) {
      const meta = codeByUid.get(claim.claimedByUid);
      if (meta && (!claim.code || claim.code === meta.code)) {
        list.push({
          id: `selfref:${claim.claimedByUid}`,
          rule: "Self-referral",
          severity: "high",
          subject: meta.hostName ?? claim.claimedByUid.slice(0, 10),
          detail: `Host ${meta.hostName ?? meta.code} claimed their own referral code — ₹${50} credit may have been issued fraudulently.`,
          count: 1,
        });
      }
    }

    // Rule 5 — referral burst (one code claimed >=3 times in 24h)
    const claimsByCode = new Map<string, Claim[]>();
    claims.forEach((c) => {
      if (!c.code) return;
      const arr = claimsByCode.get(c.code) ?? [];
      arr.push(c);
      claimsByCode.set(c.code, arr);
    });
    for (const [code, cs] of claimsByCode.entries()) {
      const sorted = [...cs].sort((a, b) => (a.claimedAt ?? 0) - (b.claimedAt ?? 0));
      for (let i = 0; i < sorted.length; i++) {
        const start = sorted[i].claimedAt ?? 0;
        const inWindow = sorted.slice(i).filter((c) => (c.claimedAt ?? 0) - start < DAY).length;
        if (inWindow >= 3) {
          const meta = codeByUid.get(code);
          list.push({
            id: `burst:${code}`,
            rule: "Referral burst",
            severity: "medium",
            subject: meta?.hostName ?? code,
            detail: `${inWindow} claims of code ${code} in 24h — could be genuine sharing or coordinated credit farming.`,
            count: inWindow,
          });
          break;
        }
      }
    }

    list.sort((a, b) => (a.severity === "high" ? -1 : a.severity === "medium" ? (b.severity === "high" ? 1 : -1) : (b.severity === "high" || b.severity === "medium" ? 1 : -1)));
    return list;
  }, [requests, claims, codes]);

  const filtered = useMemo(
    () => (query.trim() ? flags.filter((f) => `${f.rule} ${f.subject} ${f.detail}`.toLowerCase().includes(query.toLowerCase())) : flags),
    [flags, query]
  );

  const totals = useMemo(() => ({
    high: flags.filter((f) => f.severity === "high").length,
    medium: flags.filter((f) => f.severity === "medium").length,
    low: flags.filter((f) => f.severity === "low").length,
  }), [flags]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setQuery("");
    Promise.all([
      get(ref(database, "chargingRequests")).catch(() => null),
      get(ref(database, "referralClaims")).catch(() => null),
      get(ref(database, "referralCodes")).catch(() => null),
    ])
      .then(([reqSnap, claimsSnap, codesSnap]) => {
        setRequests(flattenRequests(reqSnap?.exists() ? (reqSnap.val() as Record<string, Record<string, unknown>>) : null));
        const claimList: Claim[] = [];
        claimsSnap?.forEach((child) => {
          const c = child.val() as { claimedAt?: number; code?: string };
          claimList.push({ claimedByUid: child.key!, claimedAt: c?.claimedAt, code: c?.code });
        });
        setClaims(claimList);
        const codeList: CodeMeta[] = [];
        codesSnap?.forEach((child) => {
          const m = child.val() as { hostUid?: string; hostName?: string };
          if (m?.hostUid) codeList.push({ code: child.key!, hostUid: m.hostUid, hostName: m.hostName });
        });
        setCodes(codeList);
      })
      .catch((e) => setError(e?.message || "Failed to load data"))
      .finally(() => setLoading(false));
  };

  return (
    <ResponsiveContainer size="xl" className="py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" /> Fraud &amp; Anomaly Detection
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Automatic read-only scan of every booking request and referral claim. Flags suspicious
            patterns — rapid-fire bookings, cancellation abuse, self-referrals, and referral bursts —
            for admin review. No data is modified.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={loading} onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Rescan
        </Button>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Flags raised</p>
              <p className="text-2xl font-bold text-foreground">{flags.length}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className={totals.high > 0 ? "border-red-500/50" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">High severity</p>
              <p className="text-2xl font-bold text-red-400">{totals.high}</p>
            </div>
            <Flame className="w-6 h-6 text-red-400" />
          </CardContent>
        </Card>
        <Card className={totals.medium > 0 ? "border-amber-500/50" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Medium</p>
              <p className="text-2xl font-bold text-amber-400">{totals.medium}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </CardContent>
        </Card>
        <Card className={totals.low > 0 ? "border-blue-500/50" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="text-2xl font-bold text-blue-400">{totals.low}</p>
            </div>
            <Info className="w-6 h-6 text-blue-400" />
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter flags by rule, subject, or detail…"
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <Card className="border-red-500/40">
          <CardContent className="p-6 text-center">
            <UserX className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="p-10 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Scanning {requests.length} booking requests and {claims.length} referral claims…</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Users className="w-10 h-10 text-ev-green mx-auto mb-3" />
            <p className="font-medium text-foreground">All clear</p>
            <p className="text-sm text-muted-foreground mt-1">
              {flags.length === 0
                ? "No suspicious patterns detected across bookings and referrals."
                : "No flags match the current filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="max-w-md">Detail</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => {
                const meta = SEVERITY_META[f.severity];
                const Icon = meta.icon;
                return (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Badge variant="outline" className={meta.cls}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{f.rule}</TableCell>
                    <TableCell className="font-mono text-xs">{f.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">{f.detail}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground">{f.count}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        Analysis runs entirely in your browser from live data — nothing is stored or changed. High-severity
        flags (self-referrals) should be cross-checked against the Payouts and Referrals panels before action.
      </p>
    </ResponsiveContainer>
  );
}
