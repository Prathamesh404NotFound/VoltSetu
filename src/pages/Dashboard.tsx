import { useState, useEffect } from "react";
import { User, MapPin, Clock, DollarSign, Zap, TrendingUp, History, Settings, Car } from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SpotCard from "@/components/SpotCard";
import HostRegistrationModal from "@/components/HostRegistration/HostRegistrationModal";
import { getUserProfile, UserProfile } from "@/lib/userService";
import { getUserBookings, BookingRequest } from "@/lib/bookingService";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserProfile(user.id),
      getUserBookings(user.id)
    ]).then(([p, b]) => {
      setProfile(p);
      setBookings(b);
    }).finally(() => {
      setLoading(false);
    });
  }, [user]);

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

        <Card className="rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
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
                    <span className={`text-[10px] uppercase font-bold tracking-wide ${booking.status === "completed" ? "text-green-600" : booking.status === "pending" || booking.status === "approved" ? "text-amber-500" : "text-muted-foreground"}`}>
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
              <h3 className="font-display font-bold text-2xl text-foreground mb-2">Want to earn with ChargeNest?</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
                Register your home outlet to start earning ₹3,000–5,000+ per month. Registration is free and takes 5 minutes.
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="gradient-green w-40" asChild>
                  <Link to="/host">Register</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(profile?.role === "host" || profile?.role === "admin") && (
          <Card className="flex flex-col rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Host Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-14 text-base gap-3" asChild>
                <Link to="/dashboard/earnings">
                  <DollarSign className="w-5 h-5 text-green-600" />
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
        )}
      </div>
    </div>
  );
}
