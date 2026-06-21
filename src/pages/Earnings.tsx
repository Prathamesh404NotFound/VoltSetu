import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, IndianRupee, Zap, BarChart3,
  Loader2, MapPin, Clock, CheckCircle2, AlertCircle, Home
} from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/lib/userService";
import { getHostEarnings, EarningsSummary } from "@/lib/earningsService";
import { toast } from "sonner";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import HostRegistrationModal from "@/components/HostRegistration/HostRegistrationModal";
import SEO from "@/components/SEO";
import type { User } from "@/types";

export default function Earnings() {
  const { user } = useAuth() as { user: User | null };
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const profile = await getUserProfile(user.id);
        const host = profile.role === "host" || profile.role === "admin";
        setIsHost(host);
        if (host) {
          const data = await getHostEarnings(user.id);
          setSummary(data);
        }
      } catch {
        toast.error("Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    return new Date(typeof ts === "number" ? ts : Date.now())
      .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (!user) return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <IndianRupee className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="font-display font-bold text-2xl text-foreground">Sign in to view earnings</h2>
        <Button onClick={() => setShowLogin(true)}>Sign In</Button>
      </div>
      <GoogleLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );

  if (loading) return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!isHost) return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-ev-green/10 to-primary/10 p-10 text-center space-y-5">
            <div className="w-20 h-20 gradient-green rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Home className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground">You're not a host yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Register your charging spot to start earning. Hosts earn ₹3,000–₹5,000/month on average.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setShowRegister(true)} className="gradient-green hover:opacity-90">
                Register as Host
              </Button>
              <Button variant="outline" asChild><Link to="/host">Learn More</Link></Button>
            </div>
          </div>
        </Card>
      </div>
      <HostRegistrationModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </div>
  );

  return (
    <div className="pt-24 pb-16">
      <SEO 
        title="Host Earnings | VoltSetu"
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earned", value: `₹${summary?.totalEarned ?? 0}`, icon: IndianRupee, color: "text-green-600" },
            { label: "Completed", value: summary?.completedSessions ?? 0, icon: CheckCircle2, color: "text-blue-600" },
            { label: "Pending", value: summary?.pendingSessions ?? 0, icon: AlertCircle, color: "text-amber-600" },
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
                  <p className="font-bold text-green-600">₹{Math.round(data.earned)}</p>
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
                    <p className={`font-bold text-sm ${entry.earned > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                      {entry.earned > 0 ? `+₹${Math.round(entry.earned)}` : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
