import ChargePlanner from "@/components/ChargePlanner";
import { Link } from "react-router-dom";
import { ArrowRight, BatteryCharging } from "lucide-react";

/**
 * Homepage bonus section — pairs the interactive "Plan My Charge" range
 * estimator with a link to the Roadside Rescue page. Pure client-side math,
 * no external calls, safe to render even offline.
 */
export default function PlanMyChargeSection() {
  return (
    <section className="py-20 lg:py-24 bg-soft-gray">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-5">
              <BatteryCharging className="w-3.5 h-3.5" /> Ride smarter
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Not sure how far your battery will take you?
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Slide your battery level in, see your realistic remaining range and what a quick top-up would cost, then jump straight to verified spots near you — or trigger Roadside Rescue if you're already stranded.
            </p>
            <ul className="space-y-2.5 mb-8">
              {[
                ["Instant range estimate", "for typical Indian EV two-wheelers"],
                ["Top-up time & cost", "at average neighborhood outlet rates"],
                ["One tap to live spots", "in any ChargePush city"],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-ev-green shrink-0" />
                  <span><span className="font-medium text-foreground">{t}</span> — {d}</span>
                </li>
              ))}
            </ul>
            <Link to="/rescue" className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold hover:gap-3 transition-all">
              Stranded right now? Start Roadside Rescue <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <ChargePlanner />
        </div>
      </div>
    </section>
  );
}
