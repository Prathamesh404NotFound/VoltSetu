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
import { toast } from "sonner";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import { User } from "@/types";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",   icon: AlertCircle },
  approved:  { label: "Approved",  color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",       icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",   icon: CheckCircle2 },
  rejected:  { label: "Rejected",  color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",           icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",          icon: XCircle },
} as const;

const FILTERS = ["All", "Pending", "Approved", "Completed", "Cancelled", "Rejected"];

export default function BookingHistory() {
  const { user } = useAuth() as { user: User | null };
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserBookings(user.id)
      .then(setBookings)
      .catch(() => toast.error("Failed to load booking history"))
      .finally(() => setLoading(false));
  }, [user]);

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
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, color: "text-amber-600" },
            { label: "Completed", value: bookings.filter(b => b.status === "completed").length, color: "text-green-600" },
            { label: "Cancelled", value: bookings.filter(b => b.status === "cancelled" || b.status === "rejected").length, color: "text-red-500" },
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
                        booking.status === "completed" ? "bg-green-500" :
                        booking.status === "pending" ? "bg-amber-400" :
                        booking.status === "approved" ? "bg-blue-500" : "bg-gray-300"
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
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                              <Icon className="w-3 h-3" />{cfg.label}
                            </span>
                          </div>
                        </div>

                        {booking.status === "pending" && (
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleCancel(booking)}
                              disabled={cancelling === booking.id}>
                              {cancelling === booking.id
                                ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Cancelling...</>
                                : "Cancel Request"}
                            </Button>
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
    </div>
  );
}
