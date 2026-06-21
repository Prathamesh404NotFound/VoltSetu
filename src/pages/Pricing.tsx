import { CheckCircle, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import FAQAccordion from "@/components/FAQAccordion";
import CTABanner from "@/components/CTABanner";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

const plans = [
  {
    name: "Basic",
    desc: "For casual riders",
    price: "Rs 5",
    unit: "/ 10 min",
    features: ["Standard outlets", "Basic support", "Community ratings", "Pay per use"],
    highlighted: false,
  },
  {
    name: "Featured",
    desc: "Most popular choice",
    price: "Rs 10",
    unit: "/ 10 min",
    features: ["Verified outlets", "Priority support", "Fast charging spots", "Detailed reviews", "WhatsApp alerts"],
    highlighted: true,
  },
  {
    name: "Premium",
    desc: "For power users",
    price: "Rs 15",
    unit: "/ 10 min",
    features: ["Premium outlets", "Dedicated support", "Guaranteed availability", "Extended hours", "Priority booking", "Monthly reports"],
    highlighted: false,
  },
];

const pricingFaqs = [
  { q: "Who sets the charging price?", a: "Hosts set their own prices based on their electricity costs and local demand. VoltSetu provides recommended pricing guidelines." },
  { q: "What is VoltSetu's commission?", a: "VoltSetu charges a small platform fee of 15% on each transaction. This covers payment processing, insurance, support, and platform operations." },
  { q: "Are there any hidden fees?", a: "Absolutely not. The price shown on the spot listing is the exact price you pay per 10 minutes. No registration fee, no membership charges." },
  { q: "How does the host receive payment?", a: "Hosts receive 85% of each transaction, deposited weekly to their registered bank account." },
];

export default function Pricing() {
  useScrollReveal();

  return (
    <div className="pt-24">
      <SEO 
        title="VoltSetu Pricing — Transparent & Affordable EV Charging"
        description="Pay-per-use EV charging starting at just ₹5 for 10 minutes. No subscriptions, no hidden fees. Understand our fair pricing model for both riders and hosts."
      />
      {/* Hero */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-ev-green/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Pay only for what you use. No subscriptions, no hidden fees. Just plug in, charge, and pay per 10 minutes.
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
                  "reveal relative rounded-2xl p-8 transition-all hover:-translate-y-2 duration-500",
                  plan.highlighted
                    ? "bg-card border-2 border-primary shadow-xl scale-105 z-10"
                    : "bg-card border border-border shadow-sm"
                )}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full gradient-primary text-white text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Recommended
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                  <div className="mt-4">
                    <span className="font-display font-bold text-4xl text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.unit}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className={cn("w-4 h-4 flex-shrink-0", plan.highlighted ? "text-primary" : "text-ev-green")} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-sm transition-all",
                    plan.highlighted
                      ? "gradient-primary text-white shadow-lg hover:opacity-90"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  )}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              How Pricing Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 reveal">
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Rider Pays</div>
              <div className="font-display font-bold text-2xl text-primary mb-1">Rs 10</div>
              <div className="text-xs text-muted-foreground">per 10 minutes</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Host Earns</div>
              <div className="font-display font-bold text-2xl text-ev-green mb-1">Rs 8.50</div>
              <div className="text-xs text-muted-foreground">85% of payment</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Platform Fee</div>
              <div className="font-display font-bold text-2xl text-foreground mb-1">Rs 1.50</div>
              <div className="text-xs text-muted-foreground">15% commission</div>
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
