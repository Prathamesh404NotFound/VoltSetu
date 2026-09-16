import { useState, useEffect } from "react";
import { User, MapPin, Clock, DollarSign, Zap, TrendingUp, History, Settings, Car, Heart, Copy, Pause, Play, Share2, MessageCircle } from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SpotCard from "@/components/SpotCard";
import HostRegistrationModal from "@/components/HostRegistration/HostRegistrationModal";
import SpotEditor from "@/components/SpotEditor";
import HostMessagesSection from "@/components/HostMessagesSection";
import { Pencil } from "lucide-react";
import { getUserProfile, UserProfile } from "@/lib/userService";
import { getUserBookings, type BookingRequest } from "@/lib/bookingService";
import { setLiveStatus, getLiveStatus, subscribeLiveStatus } from "@/lib/liveStatusService";
import { getHostSettings, setListingPaused, isHostPaused } from "@/lib/hostSettingsService";
import { getReferralStats, ensureReferralCode } from "@/lib/referralService";
import { getSpotSessionTrend, getHostSpotStats } from "@/lib/hostDashboardService";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getHostSpots } from "@/lib/hostRegistration";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { get, ref } from "firebase/database";
import { database } from "@/lib/firebase-services";
import { 
  setSpotOccupied, 
  subscribeToAllAvailability, 
  formatRelativeTime,
  SpotAvailability 
} from "@/lib/availabilityService";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { isDark } from "@/lib/theme";
import { successTextClasses } from "@/lib/darkTokens";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [hostSpots, setHostSpots] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<string, SpotAvailability>>({});
  const [loading, setLoading] = useState(true);
  // Host feature state
  const [liveStatuses, setLiveStatuses] = useState<Record<string, boolean>>({});
  const [hostSettings, setHostSettings] = useState<HostSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [trendData, setTrendData] = useState<{ labels: string[]; completed: number[] } | null>(null);
  const [editingSpot, setEditingSpot] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserProfile(user.id),
      getUserBookings(user.id),
      getHostSpots(user.id)
    ]).then(([p, b, s]) => {
      setProfile(p);
      setBookings(b);
      setHostSpots(s);
    }).finally(() => {
      setLoading(false);
    });
  }, [user]);

  // Host features: live status subscription, settings, referral stats, session trend
  const isHost = profile?.role === "host" || profile?.role === "admin";
  useEffect(() => {
    if (!user || !isHost || hostSpots.length === 0) return;
    const subs: (() => void)[] = [];
    hostSpots.forEach((spot) => {
      subs.push(subscribeLiveStatus(spot.id, (s) => {
        setLiveStatuses((prev) => ({ ...prev, [spot.id]: s.available }));
      }));
    });
    return () => subs.forEach((u) => u());
  }, [user, isHost, hostSpots.length]);

  useEffect(() => {
    if (!user || !isHost) return;
    Promise.all([
      getHostSettings(user.id),
      ensureReferralCode(user.id, profile?.displayName || user.displayName || "ChargePush Host"),
    ]).then(([settings]) => {
      setHostSettings(settings);
      getReferralStats(user.id).then(setReferral);
    });
  }, [user, isHost]);

  useEffect(() => {
    if (!user || !isHost || hostSpots.length === 0) return;
    const requestsPromises = hostSpots.map((spot) =>
      get(ref(database, `spotRequests/${spot.id}`)).catch(() => ({ exists: () => false, val: () => null }))
    );
    Promise.all(requestsPromises).then((snaps) => {
      const allRequests = snaps.flatMap((snap: any) => {
        if (!snap.exists()) return [];
        return Object.entries(snap.val() as any).map(([id, r]: any) => ({ id, ...r }));
      });
      setTrendData(getSpotSessionTrend(allRequests));
    });
  }, [user, isHost, hostSpots.length]);

  useEffect(() => {
    const unsub = subscribeToAllAvailability((map) => {
      setAvailabilities(map);
    });
    return unsub;
  }, []);

  const handleToggleOccupancy = async (spotId: string, current: boolean) => {
    try {
      await setSpotOccupied(spotId, !current);
      toast.success(`Spot marked as ${!current ? "occupied" : "free"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleToggleLive = async (spotId: string, current: boolean) => {
    if (!user) return;
    try {
      await setLiveStatus(spotId, user.id, !current);
      setLiveStatuses((prev) => ({ ...prev, [spotId]: !current }));
      toast.success(!current ? "Your spot is now showing Available now" : "Your spot is now showing Occupied");
    } catch (err: any) {
      toast.error(err.message || "Failed to update live status");
    }
  };

  const handlePauseListing = async (paused: boolean, pause24h: boolean) => {
    if (!user) return;
    try {
      await setListingPaused(
        user.id,
        paused,
        paused && pause24h ? new Date(Date.now() + 24 * 3600000).toISOString() : null
      );
      setHostSettings((prev) => (prev ? { ...prev, listingPaused: paused } : prev));
      toast.success(paused ? "Listing paused — riders see you're away" : "Listing is live again");
    } catch (err: any) {
      toast.error(err.message || "Failed to update listing status");
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      toast.success("Referral code copied");
    } catch {
      toast.error("Copy failed — long-press the code to select it");
    }
  };

  // Round 20: one-tap WhatsApp share of the referral code (Web Share API fallback to WhatsApp deep link).
  const handleShareReferral = async () => {
    if (!referral) return;
    const message = `Earn money with ChargePush! Register your home EV charging spot and get paid by nearby riders. Use my referral code ${referral.code} when signing up at https://chargepush.com — refer a host and they earn credit too!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Earn with ChargePush", text: message, url: "https://chargepush.com" });
        return;
      } catch {
        /* share cancelled or unsupported — fall through to WhatsApp */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  const totalSpent = bookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + (b.estimatedCost || (b.pricePerHour * b.duration) / 60), 0);

  const completedCount = bookings.filter(b => b.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <SEO 
        title="My Dashboard | ChargePush"
        description="Manage your EV charging sessions, track your carbon footprint, and monitor your host earnings in one place."
        noindex={true}
      />
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-card-foreground mb-2">
            Welcome back, {profile?.displayName || user?.displayName || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Manage your charging sessions and host earnings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/spots">
              <MapPin className="w-4 h-4" />
              Find Spots
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/saved">
              <Heart className="w-4 h-4" />
              Saved Spots
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">All time charging costs</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Completed charges</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <History className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">Including pending & cancelled</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300" asChild>
          <Link to="/saved">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved CO₂</CardTitle>
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount * 4 || "—"} kg</div>
            <p className="text-xs text-muted-foreground">Estimated at ~4kg CO₂ per charge vs. petrol scooter</p>
          </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="flex flex-col rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link to="/dashboard/bookings" className="text-sm text-primary hover:underline font-medium">
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {bookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">You haven't booked any charging sessions yet.</p>
                <Button asChild><Link to="/spots">Find a Spot</Link></Button>
              </div>
            ) : (
              bookings.slice(0, 4).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{booking.spotName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(typeof booking.requestedAt === "number" ? booking.requestedAt : Date.now()).toLocaleDateString("en-IN", { month: "short", day: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">₹{booking.estimatedCost || Math.round((booking.pricePerHour * booking.duration) / 60)}</p>
                    <span className={`text-[10px] uppercase font-bold tracking-wide ${booking.status === "completed" ? successTextClasses() : booking.status === "pending" || booking.status === "approved" ? (isDark() ? "text-[#D97706]" : "text-[#D97706]") : "text-muted-foreground"}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {profile?.role !== "host" && profile?.role !== "admin" && (
          <Card className="overflow-hidden relative bg-gradient-to-br from-ev-green/10 to-primary/10 border-none rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8 pb-10 mt-4 text-center">
              <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-5">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground mb-2">Power Your Neighborhood with ChargePush Host</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
                List your power outlet, set availability, and earn from nearby EV riders.
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="gradient-primary w-40 btn-forward" asChild>
                  <Link to="/host">Become a Host</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(profile?.role === "host" || profile?.role === "admin") && (
          <div className="space-y-6">
            <Card className="flex flex-col rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Host Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-14 text-base gap-3" asChild>
                  <Link to="/dashboard/earnings">
                    <DollarSign className={`w-5 h-5 ${successTextClasses()}`} />
                    View Host Earnings
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-14 text-base gap-3" asChild>
                  <Link to="/spots">
                    <MapPin className="w-5 h-5 text-primary" />
                    View My Spots
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Manage Spot Occupancy</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Set your spots as free or occupied in real-time</p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {hostSpots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No spots registered yet.</p>
                ) : (
                  hostSpots.map((spot) => {
                    const status = availabilities[spot.id];
                    const isOccupied = status?.isOccupied || false;
                    return (
                      <div key={spot.id} className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{spot.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last updated: {status?.updatedAt ? formatRelativeTime(status.updatedAt) : "Never"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase ${isOccupied ? (isDark() ? "text-[#D97706]" : "text-[#D97706]") : (isDark() ? "text-[#16A34A]" : "text-[#16A34A]")}`}>
                              {isOccupied ? "Occupied" : "Free"}
                            </span>
                            <button
                              onClick={() => setEditingSpot(spot)}
                              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted"
                              title="Edit spot details"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <Switch 
                              checked={isOccupied} 
                              onCheckedChange={() => handleToggleOccupancy(spot.id, isOccupied)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <div>
                            <p className="text-[11px] font-medium text-foreground">Available now</p>
                            <p className="text-[10px] text-muted-foreground">Riders see a live dot on your spot</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${liveStatuses[spot.id] !== false ? "bg-[#16A34A] animate-pulse" : "bg-[#DC2626]"}`} />
                            <Switch
                              checked={liveStatuses[spot.id] !== false}
                              onCheckedChange={() => handleToggleLive(spot.id, liveStatuses[spot.id] !== false)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* In-app rider–host chat inbox */}
            {isHost && user ? <HostMessagesSection hostUid={user.id} /> : null}

            {/* Listing pause control */}
            <Card className="flex flex-col rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {hostSettings?.listingPaused ? <Pause className={`w-4 h-4 ${isDark() ? "text-[#D97706]" : "text-[#D97706]"}`} /> : <Play className={`w-4 h-4 ${isDark() ? "text-[#16A34A]" : "text-[#16A34A]"}`} />}
                  Listing Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{hostSettings?.listingPaused ? "Listing paused" : "Listing live"}</p>
                    <p className="text-xs text-muted-foreground">
                      {hostSettings?.listingPaused
                        ? "Riders can't book until you unpause"
                        : "Pause when you're away on holiday or busy"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={!!hostSettings?.pausedUntil}
                        onChange={(e) => handlePauseListing(true, e.target.checked)}
                        className="accent-primary"
                      />
                      Auto-unpause in 24h
                    </label>
                    <Switch
                      checked={!hostSettings?.listingPaused}
                      onCheckedChange={(v) => handlePauseListing(!v, !!hostSettings?.pausedUntil)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral rewards */}
            {referral && (
              <Card className="overflow-hidden relative bg-gradient-to-br from-ev-green/10 to-primary/10 border-none rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-ev-green" /> Invite hosts, earn ₹50 each
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    When a host you invite gets approved, ₹50 credit lands in your account. You've referred <span className="font-bold">{referral.referredCount}</span> hosts (₹{referral.credits} earned).
                  </p>
                  <div className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2">
                    <code className="font-mono text-sm font-bold text-primary flex-1 overflow-x-auto">{referral.code}</code>
                    <Button variant="ghost" size="sm" onClick={handleCopyReferralCode} className="shrink-0 gap-1.5">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </Button>
                  </div>
                  <Button className="w-full mt-3 gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white" onClick={handleShareReferral}>
                    <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 7-day session trend (hosts) / engagement (riders) */}
        {isHost && hostSpots.length > 0 && (
          <Card className="rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Sessions — last 7 days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.labels.map((l, i) => ({ day: l, sessions: trendData.completed[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={24} />
                      <Tooltip formatter={(v: any) => [`${v} sessions`, "Sessions"]} />
                      <Line type="monotone" dataKey="sessions" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No sessions recorded yet — completed bookings will chart here.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
