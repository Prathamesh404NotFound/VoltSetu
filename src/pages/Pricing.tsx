import { Link } from "react-router-dom";
import { CheckCircle, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import FAQAccordion from "@/components/FAQAccordion";
import CTABanner from "@/components/CTABanner";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

const plans = [
  {
    name: "Standard AC",
    desc: "3.3kW 16A outlets",
    price: "₹8–15",
    unit: "/ hr (set by host)",
    features: ["Standard 16A socket access", "Community verified hosts", "Pay per session duration", "Direct host navigation"],
    highlighted: false,
    cta: "Find Standard Spot",
    href: "/spots",
  },
  {
    name: "Fast AC",
    desc: "7.4kW+ Level 2 charging",
    price: "₹15–30",
    unit: "/ hr (set by host)",
    features: ["High-speed AC charger", "Verified active outlet", "WhatsApp arrival alerts", "Detailed host reviews"],
    highlighted: true,
    cta: "Find Fast Charger",
    href: "/spots",
  },
  {
    name: "Roadside Rescue",
    desc: "Urgent SOS charging window",
    price: "Host rate",
    unit: " (no surge markup)",
    features: ["15-min priority booking window", "Nearest open host matching", "Direct host phone & WhatsApp", "National 112 backup fallback"],
    highlighted: false,
    cta: "Get Emergency Charge",
    href: "/rescue",
  },
];

const pricingFaqs = [
  { q: "Who sets the charging price?", a: "Hosts set their own prices based on their electricity costs and local demand. ChargePush provides recommended pricing guidelines." },
  { q: "What is ChargePush's platform fee?", a: "ChargePush charges a transparent platform fee on each transaction. This covers payment processing, host support, and platform operations." },
  { q: "Are there any hidden fees?", a: "Absolutely not. The price shown on the spot listing is the exact price you pay per charging duration. No registration fee, no membership charges." },
  { q: "How does the host receive payment?", a: "Hosts receive their earnings directly to their registered bank account or payout method." },
];

export default function Pricing() {
  useScrollReveal();

  return (
    <div className="pt-24 bg-[#F4F6F9] min-h-screen">
      <SEO 
        title="ChargePush Pricing — Transparent & Affordable EV Charging"
        description="Pay-per-use EV charging access starting at affordable rates. No subscriptions, no hidden fees. Understand our fair pricing model for both riders and hosts."
      />
      {/* Hero */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto font-medium">
            Pay only for what you use. No subscriptions, no hidden fees. Find power, charge, and keep moving.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 -mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={cn(
                  "reveal relative rounded-3xl p-8 transition-all hover:-translate-y-2 duration-500 flex flex-col justify-between",
                  plan.highlighted
                    ? "bg-gradient-to-b from-white via-blue-50/50 to-indigo-50/30 border-2 border-primary shadow-2xl scale-105 z-10"
                    : "bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/90 shadow-lg"
                )}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full gradient-primary text-white text-xs font-extrabold flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3.5 h-3.5" /> Recommended
                  </div>
                )}
                <div>
                  <div className="text-center mb-6">
                    <h3 className="font-display font-bold text-xl text-foreground mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{plan.desc}</p>
                    <div className="mt-4 bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60 shadow-inner-xs">
                      <span className="font-display font-black text-4xl text-foreground tracking-tight">{plan.price}</span>
                      <span className="text-muted-foreground text-xs font-semibold">{plan.unit}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                        <CheckCircle className={cn("w-4 h-4 flex-shrink-0", plan.highlighted ? "text-primary" : "text-emerald-600")} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={plan.href}
                  className={cn(
                    "block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all btn-forward shadow-md",
                    plan.highlighted
                      ? "gradient-primary text-white shadow-primary/30 hover:opacity-90"
                      : "bg-white border border-slate-200 text-foreground hover:bg-slate-50"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown */}
      <section className="py-20 bg-[#EAF0F6] border-t border-slate-200/80">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Transparent Fee Breakdown
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 reveal">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 text-center shadow-md">
              <div className="text-sm font-medium text-muted-foreground mb-2">Rider Session</div>
              <div className="font-display font-black text-2xl text-primary mb-1">₹10</div>
              <div className="text-xs text-muted-foreground">example charge session</div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 text-center shadow-md">
              <div className="text-sm font-medium text-muted-foreground mb-2">Host Net Payout</div>
              <div className="font-display font-black text-2xl text-emerald-600 mb-1">₹8.50</div>
              <div className="text-xs text-muted-foreground">85% of total payment</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Platform Fee</div>
              <div className="font-display font-bold text-2xl text-foreground mb-1">₹1.50</div>
              <div className="text-xs text-muted-foreground">15% platform fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center reveal">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">Fair for Everyone</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Our pricing model is designed to be affordable for riders and profitable for hosts. Riders save compared to commercial charging stations, and hosts earn meaningful income with minimal effort. We keep our commission low to ensure maximum value for both sides of the marketplace.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">Pricing FAQ</h2>
          </div>
          <div className="reveal">
            <FAQAccordion faqs={pricingFaqs} />
          </div>
        </div>
      </section>

      <CTABanner variant="dark" />
    </div>
  );
}
