import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, IndianRupee, Zap, BarChart3,
  Loader2, MapPin, Clock, CheckCircle2, AlertCircle, Home, Award
} from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/lib/userService";
import { getHostEarnings, EarningsSummary } from "@/lib/earningsService";
import { getHostSpots, getHostSpotStats, hostRespondToRequest,
  getHostPendingQueue, listenPendingQueue, getHostAvailability,
  setHostAvailability, getHostPayoutRequests, requestPayout,
  HostSpot, HostBookingRequest, AvailabilitySlot, PayoutRequest,
} from "@/lib/hostDashboardService";
import {
  referralCodeFor,
  ensureReferralCode,
  getReferralStats,
  REFERRAL_MILESTONES,
  CREDIT_PER_APPROVAL,
  type ReferralStats,
} from "@/lib/referralService";
import { exportHostEarningsCsv } from "@/lib/earningsExportService";
import { ArrowDownToLine, LayoutGrid } from "lucide-react";
import { isDark } from "@/lib/theme";
import { statusTextColor, successTextClasses, dangerOutlineClasses } from "@/lib/darkTokens";
import HostChatInbox from "@/components/HostChatInbox";
import { toast } from "sonner";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import HostRegistrationModal from "@/components/HostRegistration/HostRegistrationModal";
import SEO from "@/components/SEO";
import type { User } from "@/types";

const HOST_TABS = ["Earnings", "Requests", "Calendar", "Chat", "Payouts"] as const;
type HostTab = (typeof HOST_TABS)[number];

export default function Earnings() {
  const { user } = useAuth() as { user: User | null };
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // ── Host workspace tabs ──
  const [hostTab, setHostTab] = useState<HostTab>("Earnings");
  const [spots, setSpots] = useState<HostSpot[]>([]);
  const [spotStats, setSpotStats] = useState<Record<string, Awaited<ReturnType<typeof getHostSpotStats>>>>({});
  const [queue, setQueue] = useState<HostBookingRequest[]>([]);
  const [calendar, setCalendar] = useState<Record<string, Record<string, AvailabilitySlot>>>({});
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [hostLoading, setHostLoading] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !isHost) return;
    let disposed = false;
    (async () => {
      setHostLoading(true);
      try {
        const hostSpots = await getHostSpots(user.id);
        if (disposed) return;
        setSpots(hostSpots);
        const stats: typeof spotStats = {};
        for (const spot of hostSpots) {
          stats[spot.id] = await getHostSpotStats(spot);
        }
        if (disposed) return;
        setSpotStats(stats);
        const q = await getHostPendingQueue(user.id);
        if (disposed) return;
        // Surface each pending rider's reputation (host ratings of riders) so
        // hosts can make informed accept decisions.
        const enriched = await Promise.all(q.map((req) => enrichRiderReputation(req)));
        if (disposed) return;
        setQueue(enriched);
        const cal: typeof calendar = {};
        for (const spot of hostSpots) {
          cal[spot.id] = await getHostAvailability(user.id, spot.id);
        }
        if (disposed) return;
        setCalendar(cal);
        setPayouts(await getHostPayoutRequests(user.id));
        try {
          const prof = await getUserProfile(user.id);
          await ensureReferralCode(user.id, prof.name || "ChargePush Host");
        } catch {
        }
      } catch (err) {
        console.error("Error loading host data:", err);
      } finally {
        if (!disposed) setHostLoading(false);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [user, isHost]);

  if (!user) return null;

  return (
    <>
      <SEO 
        title="Host Earnings | ChargePush"
        description="Track your earnings from every charging session. View per-spot performance and weekly revenue summaries."
        noindex={true}
      />
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">My Earnings</h1>
            <p className="text-muted-foreground text-sm">Revenue from your charging spots</p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={() => {
                setExporting(true);
                exportHostEarningsCsv(user.id)
                  .then((stats) =>
                    toast.success(
                      stats.sessions > 0
                        ? `Exported ${stats.sessions} sessions (₹${stats.gross.toLocaleString("en-IN")}) — file downloaded`
                        : "Nothing to export yet — completed sessions will appear here"
                    )
                  )
                  .catch(() => toast.error("Could not export earnings"))
                  .finally(() => setExporting(false));
              }}
            >
              {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ArrowDownToLine className="w-4 h-4 mr-1.5" />}
              Export CSV
            </Button>
          </div>
        </div>

        {/* Host workspace tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6 p-1 rounded-xl bg-muted/60 border border-border w-fit">
          {HOST_TABS.map(tab => {
            const badge = tab === "Requests" && queue.length > 0 ? queue.length : null;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setHostTab(tab)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  hostTab === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {badge ? (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {hostLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : hostTab === "Requests" ? (
          <div className="mb-8">
            {queue.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground mb-1">No pending requests</p>
                  <p className="text-sm text-muted-foreground">When a rider books your spot, the request appears here with one-tap Accept, Complete, or Reject actions.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {queue.map(req => (
                  <Card key={req.id} className="overflow-hidden">
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-56">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${req.emergency ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                          {req.emergency ? <Zap className="w-5 h-5 text-red-500" /> : <Clock className={`w-5 h-5 ${isDark() ? "text-[hsl(var(--electric))]" : "text-blue-600"}`} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground flex items-center gap-2">
                            {req.userName || "Rider"}
                            {req.emergency ? <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark() ? "text-red-400 border-red-500/40" : "text-red-600 border-red-200"} rounded-full px-1.5`}>Rescue</span> : null}
                            {req.riderReputation && req.riderReputation.count > 0 ? (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-ev-green border border-ev-green/40 rounded-full px-1.5">
                                ★ {req.riderReputation.average} · {req.riderReputation.count} {req.riderReputation.count === 1 ? "review" : "reviews"}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.spotName} · {req.duration ?? 0} min · {formatDate(req.requestedAt)}
                            {req.depositStatus === "paid" ? " · deposit paid" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {req.status !== "completed" && (
                          <>
                            <Button size="sm" variant="outline" className={dangerOutlineClasses()}
                              disabled={responding === req.id}
                              onClick={() => { setResponding(req.id); hostRespondToRequest(req.spotId, req.id, req.userId, "rejected", req.spotName).then(() => { setQueue(prev => prev.filter(r => r.id !== req.id)); toast.success("Request rejected"); }).catch(() => toast.error("Could not reject")).finally(() => setResponding(null)); }}>
                              Reject
                            </Button>
                            <Button size="sm" variant="outline"
                              disabled={responding === req.id}
                              onClick={() => { setResponding(req.id); hostRespondToRequest(req.spotId, req.id, req.userId, "approved", req.spotName).then(() => { setQueue(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r)); toast.success("Request approved"); }).catch(() => toast.error("Could not approve")).finally(() => setResponding(null)); }}>
                              {req.status === "approved" ? "Approved" : "Approve"}
                            </Button>
                            <Button size="sm" className="gradient-green hover:opacity-90"
                              disabled={responding === req.id}
                              onClick={() => { setResponding(req.id); hostRespondToRequest(req.spotId, req.id, req.userId, "completed", req.spotName).then(() => { setQueue(prev => prev.filter(r => r.id !== req.id)); toast.success("Session marked complete — earnings logged"); }).catch(() => toast.error("Could not complete")).finally(() => setResponding(null)); }}>
                              {responding === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Mark Complete"}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : hostTab === "Calendar" ? (
          <div className="mb-8 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />Availability Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {spots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No spots yet. Register a spot to manage its calendar.</p>
                ) : (
                  <div className="space-y-6">
                    {spots.map(spot => (
                      <div key={spot.id}>
                        <p className="text-sm font-medium text-foreground mb-2">{spot.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: 14 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() + i);
                            const key = d.toISOString().slice(0, 10);
                            const slot = calendar[spot.id]?.[key];
                            const blocked = slot?.blocked;
                            return (
                              <button
                                key={key}
                                type="button"
                                aria-label={`Toggle ${key}`}
                                onClick={async () => {
                                  const current = { ...calendar };
                                  const spotCal = { ...current[spot.id] };
                                  const was = spotCal[key];
                                  spotCal[key] = {
                                    date: key,
                                    open: was?.open ?? "09:00",
                                    close: was?.close ?? "21:00",
                                    blocked: !was?.blocked,
                                  };
                                  current[spot.id] = spotCal;
                                  setCalendar(current);
                                  try {
                                    await setHostAvailability(user!.id, spot.id, spotCal);
                                    toast.success(blocked ? "Day reopened" : "Day blocked");
                                  } catch {
                                    toast.error("Could not save calendar");
                                  }
                                }}
                                className={`h-11 w-11 rounded-lg text-[11px] font-medium border transition-colors ${
                                  blocked
                                    ? (isDark() ? "bg-red-500/15 border-red-500/40 text-red-400" : "bg-red-100 border-red-300 text-red-700")
                                    : "bg-card border-border text-foreground hover:border-primary"
                                }`}
                              >
                                {d.getDate()}
                                {blocked ? "\u00D7" : null}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          Tap a day to block it (riders cannot book blocked days). Next 14 days shown; default open hours 9:00–21:00.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : hostTab === "Chat" ? (
          <div className="mb-8">
            <HostChatInbox />
          </div>
        ) : hostTab === "Payouts" ? (
          <div className="mb-8 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                <p className={`text-2xl font-bold ${successTextClasses()}`}>₹{summary?.totalEarned ?? 0}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Already Paid Out</p>
                <p className="text-2xl font-bold text-foreground">₹{payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Due Now</p>
                <p className="text-2xl font-bold text-primary">₹{dueForPayout}</p>
              </CardContent></Card>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex-1 min-w-56">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="host-upi-id">UPI ID for payout</label>
                <input
                  id="host-upi-id"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@upi"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button className="gradient-green hover:opacity-90 shrink-0" disabled={requestingPayout || dueForPayout <= 0}
                onClick={() => { setRequestingPayout(true); requestPayout(user!.id, dueForPayout, upiId).then(async () => { setPayouts(await getHostPayoutRequests(user!.id)); setUpiId(""); toast.success("Payout requested — admin will review it"); }).catch((e: any) => toast.error(String(e?.message || "Could not request payout"))).finally(() => setRequestingPayout(false)); }}>
                {requestingPayout ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Request Payout of ₹{dueForPayout}
              </Button>
              <p className="text-xs text-muted-foreground w-full">After admin marks your payout as paid, earnings reset from the due amount.</p>
            </div>

            {/* Refer & Earn card */}
            <Card className="bg-gradient-to-br from-primary/10 to-ev-green/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Refer & Earn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Earn <strong className="text-foreground">₹{CREDIT_PER_APPROVAL}</strong> for every host you refer (credited after admin approves their listing),
                  plus milestone bonuses: <strong className="text-foreground">{REFERRAL_MILESTONES.map(m => `${m.at} hosts → ₹${m.reward}`).join(" · ")}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <code className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono truncate">
                    {referral?.code || "—"}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={!referral?.code}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referral!.code);
                        setCopied(true);
                        toast.success("Referral code copied!");
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        toast.error("Could not copy — copy manually.");
                      }
                    }}
                  >
                    {copied ? "Copied!" : "Copy code"}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>Referred: <strong className="text-foreground">{referral?.referredCount ?? 0} hosts</strong></span>
                  <span>Credits: <strong className="text-foreground">₹{referral?.credits ?? 0}</strong></span>
                  {referral?.earnedTitles.length ? (
                    <span className="inline-flex items-center gap-1">
                      {referral.earnedTitles.map(t => (
                        <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{t}</span>
                      ))}
                    </span>
                  ) : null}
                </div>
                {referral?.nextMilestone && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full gradient-green"
                        style={{ width: `${Math.min(100, Math.round(((referral.nextMilestone.at - referral.nextMilestone.remaining) / referral.nextMilestone.at) * 100))}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {referral.nextMilestone.remaining} more host{referral.nextMilestone.remaining === 1 ? "" : "s"} for <strong className="text-foreground">{referral.nextMilestone.title} (+₹{referral.nextMilestone.reward})</strong>
                    </span>
                  </div>
                )}
                {!referral?.nextMilestone && referral && (
                  <p className="text-xs text-ev-green font-semibold">All milestones earned — you're a ChargePush Ambassador!</p>
                )}
              </CardContent>
            </Card>
            {/* Round 34: per-spot performance — sessions, revenue, avg rating for each listing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-primary" /> Spot Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {spots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No spots yet.</p>
                ) : (
                  <div className="space-y-2">
                    {spots.map((spot) => {
                      const st = spotStats[spot.id];
                      return (
                        <div key={spot.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{spot.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {st ? `${st.totalBookings} session${st.totalBookings === 1 ? "" : "s"} · ₹${Math.round(st.revenue)} revenue` : "No activity yet"}
                              {st && st.averageRating > 0 ? ` · ★ ${st.averageRating.toFixed(1)} (${st.reviewCount})` : ""}
                            </p>
                          </div>
                          <span className={`text-sm font-bold shrink-0 ${successTextClasses()}`}>₹{st ? Math.round(st.revenue) : 0}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Payout History</CardTitle></CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No payout requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {payouts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${statusTextColor(p.status === "paid" ? "completed" : p.status === "processing" ? "processing" : p.status === "rejected" ? "rejected" : "pending").split(" ")[0].replace("text", "bg")}`} />
                          <p className="text-sm text-foreground">₹{p.amount} · {formatDate(p.createdAt)}{p.upiId ? ` · ${p.upiId}` : ""}</p>
                        </div>
                        <span className="text-xs font-medium capitalize text-muted-foreground">{p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earned", value: `₹${summary?.totalEarned ?? 0}`, icon: IndianRupee, color: successTextClasses() },
            { label: "Completed", value: summary?.completedSessions ?? 0, icon: CheckCircle2, color: isDark() ? "text-[hsl(var(--electric))]" : "text-blue-600" },
            { label: "Pending", value: summary?.pendingSessions ?? 0, icon: AlertCircle, color: isDark() ? "text-[hsl(var(--warning))]" : "text-amber-600" },
            { label: "Avg / Session", value: `₹${summary?.averagePerSession ?? 0}`, icon: TrendingUp, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Per-Spot Breakdown */}
        {summary && Object.keys(summary.bySpot).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />Earnings by Spot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(summary.bySpot).map(([spotId, data]) => (
                <div key={spotId} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg gradient-green flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{data.spotName}</p>
                      <p className="text-xs text-muted-foreground">{data.sessions} sessions completed</p>
                    </div>
                  </div>
                  <p className={`font-bold ${successTextClasses()}`}>₹{Math.round(data.earned)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Session log */}
        <Card>
          <CardHeader>
            <CardTitle>Session Log</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary || summary.entries.length === 0 ? (
              <div className="text-center py-12">
                <IndianRupee className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No sessions recorded yet. Your earnings will appear here once riders book your spot.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.entries.map((entry) => (
                  <div key={entry.requestId} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${entry.status === "completed" ? "bg-green-500" : entry.status === "pending" || entry.status === "approved" ? "bg-amber-400" : "bg-gray-300"}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.spotName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.duration} min</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{formatDate(entry.date)}</span>
                          <span className="capitalize">{entry.status}</span>
                        </div>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${entry.earned > 0 ? successTextClasses() : "text-muted-foreground"}`}>
                      {entry.earned > 0 ? `+₹${Math.round(entry.earned)}` : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
