import { ShieldCheck, UserCheck, Zap, HeartHandshake } from "lucide-react";

const trustPillars = [
  {
    icon: ShieldCheck,
    title: "Verified Hosts & Outlets",
    description: "Every charging spot listed on ChargePush undergoes host identity check and electrical outlet safety verification.",
    badge: "Safety First",
  },
  {
    icon: Zap,
    title: "Transparent Charging Access",
    description: "Riders see exact location, distance, plug types, and host-set pricing before starting any charging session.",
    badge: "Clear Pricing",
  },
  {
    icon: UserCheck,
    title: "Two-Way Community Ratings",
    description: "Riders rate charging reliability; hosts rate rider punctuality and care to maintain mutual network trust.",
    badge: "Mutual Trust",
  },
  {
    icon: HeartHandshake,
    title: "Neighborhood Mobility Network",
    description: "Empowering local home hosts and businesses to support riders while expanding EV charging reach across Indian cities.",
    badge: "Neighborhood First",
  },
];

export default function TestimonialCarousel() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <HeartHandshake className="w-4 h-4" /> Built for Riders & Hosts
          </div>
          <h2 className="font-display font-black text-3xl md:text-5xl text-foreground mb-4">
            Built on Real Community Trust
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            ChargePush connects electric riders with verified neighborhood charging access through standard safety and transparency principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
