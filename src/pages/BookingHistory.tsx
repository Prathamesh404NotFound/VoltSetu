import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Calendar, Clock, MapPin, Zap, BadgeCheck, XCircle,
  CheckCircle2, AlertCircle, Loader2, ReceiptText, Filter
} from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserBookings, cancelBooking, BookingRequest } from "@/lib/bookingService";
import ChatPanel from "@/components/ChatPanel";
import RateRiderModal from "@/components/RateRiderModal";
import { getUserProfile } from "@/lib/userService";
import { Star, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import {
  remindersSupported,
  scheduleReminder,
  removeReminder,
  hasReminder,
  armAllReminders,
} from "@/lib/reminderService";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import SEO from "@/components/SEO";
import { isDark } from "@/lib/theme";
import { successTextClasses, dangerOutlineClasses } from "@/lib/darkTokens";
import type { User } from "@/types";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: isDark() ? "bg-amber-500/15 text-[hsl(var(--warning))]" : "bg-amber-100 text-amber-800",   icon: AlertCircle },
  approved:  { label: "Approved",  color: isDark() ? "bg-[hsl(var(--electric))]/15 text-[hsl(var(--electric))]" : "bg-blue-100 text-blue-800",       icon: CheckCircle2 },
  completed: { label: "Completed", color: isDark() ? "bg-[hsl(var(--ev-green))]/15 text-[hsl(var(--ev-green))]" : "bg-green-100 text-green-800",   icon: CheckCircle2 },
  rejected:  { label: "Rejected",  color: isDark() ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-800",           icon: XCircle },
  cancelled: { label: "Cancelled", color: isDark() ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600",          icon: XCircle },
} as const;

const FILTERS = ["All", "Pending", "Approved", "Completed", "Cancelled", "Rejected"];

export default function BookingHistory() {
  const { user } = useAuth() as { user: User | null };
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<BookingRequest | null>(null);
  const [remindedBookings, setRemindedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([getUserBookings(user.id), getUserProfile(user.id).catch(() => null)])
      .then(([b, p]) => {
        setBookings(b);
        setUserRole(p?.role ?? null);
        const already = b.filter((x) => hasReminder(x.id)).map((x) => x.id);
        setRemindedBookings(new Set(already));
        armAllReminders();
      })
      .catch(() => toast.error("Failed to load booking history"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleReminder = async (booking: BookingRequest) => {
    if (!user) return;
    const isSet = remindedBookings.has(booking.id);
    if (isSet) {
      removeReminder(booking.id);
      setRemindedBookings((prev) => {
        const next = new Set(prev);
        next.delete(booking.id);
        return next;
      });
      toast.success("Reminder removed.");
      return;
    }
    const scheduledAt = typeof booking.requestedAt === "number" ? booking.requestedAt : Date.now();
    const result = await scheduleReminder(booking.id, booking.spotName || "Charging Spot", scheduledAt, 30);
    toast[result.ok ? "success" : "warning"](result.message);
    if (result.ok) {
      setRemindedBookings((prev) => new Set(prev).add(booking.id));
    }
  };

  const handleCancel = async (booking: BookingRequest) => {
    if (!user) return;
    setCancelling(booking.id);
    try {
      await cancelBooking(user.id, booking.id);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "cancelled" } : b));
      toast.success("Booking cancelled.");
    } catch {
      toast.error("Could not cancel booking. Please try again.");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === "All"
    ? bookings
    : bookings.filter(b => b.status === filter.toLowerCase());

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = new Date(typeof ts === "number" ? ts : Date.now());
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (!user) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ReceiptText className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="font-display font-bold text-2xl text-foreground">Sign in to view bookings</h2>
          <Button onClick={() => setShowLogin(true)}>Sign In</Button>
        </div>
        <GoogleLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <SEO 
        title="My Bookings | ChargePush"
        description="Review your past and upcoming EV charging sessions. Track approval status and session costs."
        noindex={true}
      />
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Booking History</h1>
            <p className="text-muted-foreground text-sm">All your EV charging session requests</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: bookings.length, color: "text-foreground" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, color: isDark() ? "text-[hsl(var(--warning))]" : "text-amber-600" },
            { label: "Completed", value: bookings.filter(b => b.status === "completed").length, color: successTextClasses() },
            { label: "Cancelled", value: bookings.filter(b => b.status === "cancelled" || b.status === "rejected").length, color: isDark() ? "text-red-400" : "text-red-500" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter strip */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === f ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ReceiptText className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-1">
                {bookings.length === 0 ? "No bookings yet" : "Nothing matches this filter"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {bookings.length === 0
                  ? "Find a charging spot and book your first session!"
                  : "Try a different filter."}
              </p>
              {bookings.length === 0 && (
                <Button asChild><Link to="/spots">Find Spots</Link></Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Color bar */}
                      <div className={`w-1.5 flex-shrink-0 ${
                        booking.status === "completed" ? "bg-[hsl(var(--ev-green))]" :
                        booking.status === "pending" ? "bg-[hsl(var(--warning))]" :
                        booking.status === "approved" ? "bg-[hsl(var(--electric))]" : "bg-muted-foreground/50"
                      }`} />

                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{booking.spotName || "Charging Spot"}</h3>
                              {booking.hostName && (
                                <span className="text-xs text-muted-foreground">by {booking.hostName}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(booking.requestedAt)}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.duration} min session</span>
                              {booking.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.city}</span>}
                              {booking.outletType && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{booking.outletType}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                ₹{booking.estimatedCost > 0 ? booking.estimatedCost : Math.round((booking.pricePerHour * booking.duration) / 60)}
                              </p>
                              <p className="text-xs text-muted-foreground">₹{booking.pricePerHour}/hr</p>
                              {booking.depositStatus === "paid" && (
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                  <BadgeCheck className="w-3 h-3" />₹{booking.depositAmount} deposit paid
                                </p>
                              )}
                              {booking.emergency && (
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                                  <Zap className="w-3 h-3" />Roadside Rescue
                                </p>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                              <Icon className="w-3 h-3" />{cfg.label}
                            </span>
                          </div>
                        </div>

                        {(booking.status === "pending" || booking.status === "approved") && (
                          <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
                            {booking.status === "pending" && (
                              <Button size="sm" variant="outline" className={dangerOutlineClasses()}
                                onClick={() => handleCancel(booking)}
                                disabled={cancelling === booking.id}>
                                {cancelling === booking.id
                                  ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Cancelling...</>
                                  : "Cancel Request"}
                              </Button>
                            )}
                            {remindersSupported() && booking.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className={remindedBookings.has(booking.id) ? "gap-1.5 text-ev-green border-ev-green/40" : "gap-1.5 text-primary"}
                                onClick={() => handleReminder(booking)}>
                                {remindedBookings.has(booking.id)
                                  ? <><BellRing className="w-3.5 h-3.5" />Reminder Set (30 min)</>
                                  : <><Bell className="w-3.5 h-3.5" />Remind Me (30 min before)</>}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Host rates rider after completed booking (two-way ratings) */}
                        {booking.status === "completed" && userRole === "host" && (
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" variant="outline" className="gap-1.5 text-primary"
                              onClick={() => setRatingTarget(booking)}>
                              <Star className="w-3.5 h-3.5" />Rate Rider
                            </Button>
                          </div>
                        )}

                        {/* In-app rider–host chat (active bookings only) */}
                        {booking.status !== "cancelled" && booking.status !== "rejected" && (
                          <div className="mt-3 border-t border-border pt-3">
                            <ChatPanel
                              threadId={booking.id}
                              peerName={booking.hostName || "Host"}
                              peerPhone={booking.hostPhone}
                              spotName={booking.spotName}
                              hostId={booking.hostId}
                              spotId={booking.spotId}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <RateRiderModal
        isOpen={ratingTarget !== null}
        onClose={() => setRatingTarget(null)}
        booking={ratingTarget ?? { id: "" }}
        hostUid={user?.id ?? ""}
        riderUid={ratingTarget?.userId ?? ""}
        riderName={ratingTarget?.userName}
      />
    </div>
  );
}
