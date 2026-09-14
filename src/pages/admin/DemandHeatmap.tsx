import { default as AdminContainer } from "@/components/ui/responsive-container";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, TrendingUp, MapPin,
  Loader2, Sparkles, ArrowDownToLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { getDemandHeatmap, type DemandInsight } from "@/lib/demandService";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

const STATUS_STYLES: Record<DemandInsight["status"], string> = {
  shortage: "border-red-300/60 bg-red-500/10 text-red-600",
  balanced: "border-ev-green/40 bg-ev-green/10 text-ev-green",
  surplus: "border-blue-300/60 bg-blue-500/10 text-blue-600",
};

const STATUS_LABELS: Record<DemandInsight["status"], string> = {
  shortage: "Host shortage",
  balanced: "Balanced",
  surplus: "Supply ahead",
};

export default function DemandHeatmap() {
  const [rows, setRows] = useState<DemandInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDemandHeatmap()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const shortages = rows.filter((r) => r.status === "shortage");
  const totalDemand = rows.reduce((s, r) => s + r.demand, 0);
  const totalSupply = rows.reduce((s, r) => s + r.supply, 0);

  const chartData = rows.slice(0, 12).map((r) => ({
    city: r.city,
    demand: r.demand,
    supply: r.supply,
    ratio: isFinite(r.ratio) ? r.ratio : 10,
  }));

  const exportCsv = () => {
    const header = "City,Demand (30d),Supply (live spots),Demand/Supply,Status\n";
    const body = rows
      .map((r) =>
        [
          `"${r.city}"`,
          r.demand,
          r.supply,
          isFinite(r.ratio) ? r.ratio : "∞",
          r.status,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chargepush-demand-heatmap.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminContainer size="xl" className="py-6">
      <SEO
        title="Demand Heatmap — ChargePush Admin"
        description="City-by-city demand vs supply insights."
        noIndex
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Demand Heatmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            30-day booking demand vs live spot supply, per city. Prioritise host
            outreach where demand outpaces supply.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <ArrowDownToLine className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground">Cities tracked</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground">Demand (30 days)</p>
            <p className="text-2xl font-display font-bold text-primary mt-1">{totalDemand}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground">Live spots</p>
            <p className="text-2xl font-display font-bold text-ev-green mt-1">{totalSupply}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Host-shortage cities
            </p>
            <p className="text-2xl font-display font-bold text-red-600 mt-1">{shortages.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Demand vs supply by city (30 days)
          </CardTitle>
          <CardDescription>
            Red = host shortage (demand ≥ 2× supply) — the highest-value cities
            for new host recruitment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No demand data yet. Demand appears here once riders start sending
              booking requests to spots.
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="demand" name="Demand (requests)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="supply" name="Supply (spots)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <Card key={r.slug} className="overflow-hidden">
            <CardContent className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-48">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    r.status === "shortage"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : r.status === "balanced"
                      ? "bg-ev-green/15"
                      : "bg-blue-100 dark:bg-blue-900/30"
                  )}
                >
                  <MapPin className={cn(
                    "w-5 h-5",
                    r.status === "shortage" ? "text-red-600" : r.status === "balanced" ? "text-ev-green" : "text-blue-600"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {r.city}
                    <Badge variant="outline" className={cn("text-[10px] font-bold", STATUS_STYLES[r.status])}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.demand} requests · {r.supply} live spots ·{" "}
                    {isFinite(r.ratio) ? r.ratio.toFixed(1) : "∞"}× demand ratio
                  </p>
                </div>
              </div>
              <Link
                to={`/city/${r.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <TrendingUp className="w-3.5 h-3.5" /> City page
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length === 0 && !loading && (
        <Card>
          <CardContent className="py-14 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">No city data yet</p>
            <p className="text-sm text-muted-foreground">
              As spots get city values and booking requests flow in, this
              heatmap shows where ChargePush supply is strongest and where hosts
              are most needed.
            </p>
          </CardContent>
        </Card>
      )}
    </AdminContainer>
  );
}
