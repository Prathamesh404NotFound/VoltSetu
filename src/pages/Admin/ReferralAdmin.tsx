/* ChargePush admin referral dashboard.
 *
 * Read-only audit view of the host referral program:
 * codes, claims, credits issued, and total referrals.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ResponsiveContainer from "@/components/ui/responsive-container";
import { Award, ArrowLeft, Users, Coins, Ticket, TrendingUp, ExternalLink, Medal, Crown, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminReferrals, type AdminReferralCode } from "@/lib/referralAdminService";
import { CREDIT_PER_APPROVAL, REFERRAL_MILESTONES } from "@/lib/referralService";
import SEO from "@/components/SEO";
import { useAuth } from "@/components/Auth/AuthProvider";
import { getUserProfile } from "@/lib/userService";

function fmtTime(ts: any): string {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReferralAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminReferrals>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        const profile = await getUserProfile(user.id);
        if (profile?.role !== "admin") {
          setError("Admin access required.");
          setLoading(false);
          return;
        }
        setAdmin(true);
        setData(await getAdminReferrals());
      } catch (e: any) {
        setError(e.message || "Failed to load referral data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading referral data...
      </div>
    );
  }

  if (!admin || error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <Button asChild className="mt-4">
          <Link to="/admin">Back to Admin</Link>
        </Button>
      </div>
    );
  }

  return (
    <ResponsiveContainer size="xl" className="py-6">
      <SEO
        title="Referral Program | ChargePush Admin"
        description="Audit the host referral program: codes, claims, credits and referral conversions."
        noindex
      />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl">Referral Program</h1>
          <p className="text-sm text-muted-foreground">Host referral audit — read-only</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex flex-col gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold">{data!.codes.length}</p>
            <p className="text-xs text-muted-foreground">Active referral codes</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex flex-col gap-2">
            <Users className="w-5 h-5 text-ev-green" />
            <p className="text-2xl font-bold">{data!.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Hosts referred</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex flex-col gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <p className="text-2xl font-bold">{data!.totalClaims}</p>
            <p className="text-xs text-muted-foreground">Code claims</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex flex-col gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold">₹{data!.totalCreditsIssued}</p>
            <p className="text-xs text-muted-foreground">Total credits issued (₹{CREDIT_PER_APPROVAL}/approval)</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard podium — top 3 referrers */}
      {data!.codes.filter((c) => c.referredCount > 0).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {data!.codes
            .filter((c) => c.referredCount > 0)
            .sort((a, b) => b.referredCount - a.referredCount)
            .slice(0, 3)
            .map((c, i) => {
              const rank = i + 1;
              const icon = rank === 1 ? Crown : rank === 2 ? Medal : Star;
              const colors = ["border-amber-400 bg-amber-400/10 text-amber-500", "border-slate-400 bg-slate-400/10 text-slate-500", "border-orange-400 bg-orange-400/10 text-orange-600"];
              return (
                <Card key={c.hostUid} className={`rounded-2xl border-2 ${colors[i]} ${rank === 1 ? "md:-mt-3" : ""}`}>
                  <CardContent className="p-4 text-center">
                    <icon className="w-6 h-6 mx-auto mb-1" />
                    <p className="font-bold">{c.hostName}</p>
                    <p className="text-xs text-muted-foreground">{c.code}</p>
                    <p className="mt-2 text-xl font-bold">{c.referredCount} host{c.referredCount === 1 ? "" : "s"} referred</p>
                    <p className="text-xs text-muted-foreground">₹{c.credits} earned</p>
                    {c.credits > 0 && (
                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {REFERRAL_MILESTONES.filter((m) => c.referredCount >= m.at).map((m) => (
                          <span key={m.title} className="rounded-full bg-ev-green/15 px-2 py-0.5 text-[10px] font-semibold text-ev-green">{m.title}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Codes table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg">Referral Codes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data!.codes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No referral codes yet. Codes appear after hosts register on the platform.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Referred</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Milestones</TableHead>
                    <TableHead>Claims</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.codes.map((c: AdminReferralCode) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-mono text-xs">{c.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{c.hostName}</span>
                          <Link to={`/admin/users/${c.hostUid}`} className="text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.referredCount > 0 ? "default" : "secondary"} className="bg-ev-green text-white">
                          {c.referredCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">₹{c.credits}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {REFERRAL_MILESTONES.map((m) => (
                            <div key={m.title} className="flex items-center gap-1.5 text-xs">
                              <div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-ev-green"
                                  style={{ width: `${Math.min(100, Math.round((c.referredCount / m.at) * 100))}%` }}
                                />
                              </div>
                              <span className={`truncate ${c.referredCount >= m.at ? "font-semibold text-ev-green" : "text-muted-foreground"}`}>
                                {m.title} {c.referredCount >= m.at ? `✓` : `· ${m.at - c.referredCount} to go`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {c.claims.length === 0 && <span>No claims</span>}
                          {c.claims.map((cl, i) => (
                            <span key={i}>
                              {cl.claimedByUid.slice(0, 8)}… on {fmtTime(cl.claimedAt)}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtTime(c.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        This dashboard is read-only. Credit adjustments are intentionally not exposed here — contact platform ops for corrections.
        Referral credit: ₹{CREDIT_PER_APPROVAL} per approved referred host.
      </p>
    </ResponsiveContainer>
  );
}
