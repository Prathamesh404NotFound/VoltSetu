import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { IndianRupee, Zap, CalendarClock, CalendarDays } from "lucide-react";

/**
 * Interactive earnings estimator (round 3B).
 *
 * Lets prospective hosts slide price-per-hour and daily charge sessions
 * to see realistic daily / weekly / monthly income at a 100% platform
 * take (VoltSetu charges hosts nothing). All math is client-side only.
 */

function formatRs(n: number): string {
  return `Rs ${Math.round(n).toLocaleString("en-IN")}`;
}

export default function EarningsEstimator() {
  const [price, setPrice] = useState<number[]>([10]);
  const [sessions, setSessions] = useState<number[]>([4]);

  const pricePerHour = price[0];
  const dailySessions = sessions[0];

  const summary = useMemo(() => {
    // Average rider charges 40–60 minutes; model 0.83 hrs per session.
    const hoursPerSession = 0.83;
    const daily = pricePerHour * dailySessions * hoursPerSession;
    const weekly = daily * 7;
    const monthly = daily * 30;
    return { daily, weekly, monthly };
  }, [pricePerHour, dailySessions]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm max-w-2xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Your price per hour
            </label>
            <span className="font-display font-bold text-lg text-primary">{formatRs(pricePerHour)}/hr</span>
          </div>
          <Slider
            value={price}
            onValueChange={setPrice}
            min={5}
            max={30}
            step={1}
            aria-label="Price per hour"
          />
          <p className="text-xs text-muted-foreground mt-2">Most hosts in Kolhapur charge Rs 8–15 per hour.</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-ev-green" />
              Sessions per day
            </label>
            <span className="font-display font-bold text-lg text-ev-green">{dailySessions}</span>
          </div>
          <Slider
            value={sessions}
            onValueChange={setSessions}
            min={1}
            max={12}
            step={1}
            aria-label="Charge sessions per day"
          />
          <p className="text-xs text-muted-foreground mt-2">New hosts typically see 2–4 sessions daily.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-muted/60 p-4">
          <CalendarClock className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
          <div className="font-display font-bold text-lg text-foreground">{formatRs(summary.daily)}</div>
          <div className="text-[11px] text-muted-foreground">Daily</div>
        </div>
        <div className="rounded-xl bg-muted/60 p-4">
          <CalendarDays className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
          <div className="font-display font-bold text-lg text-foreground">{formatRs(summary.weekly)}</div>
          <div className="text-[11px] text-muted-foreground">Weekly</div>
        </div>
        <div className="rounded-xl bg-ev-green/10 p-4">
          <IndianRupee className="w-4 h-4 text-ev-green mx-auto mb-1.5" />
          <div className="font-display font-bold text-lg text-ev-green">{formatRs(summary.monthly)}</div>
          <div className="text-[11px] text-muted-foreground">Monthly</div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-4">
        Estimate based on host-set rate (~50 min average session). Host payout reflects 85% net earnings after 15% platform fee.
      </p>
    </div>
  );
}
