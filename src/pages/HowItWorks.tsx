import { MapPin, Search, Navigation, QrCode, Zap, CreditCard, Star, Home, DollarSign, BadgeCheck, Users, TrendingUp, Wallet } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import CTABanner from "@/components/CTABanner";
import SEO from "@/components/SEO";

const riderSteps = [
  { icon: Search, title: "Find a Charge", desc: "Open ChargePush and search for nearby charging access from home hosts and charging spots." },
  { icon: MapPin, title: "Choose Your Spot", desc: "Compare nearby options, rates, distance, and outlet types." },
  { icon: Navigation, title: "Navigate", desc: "Get direct route directions to your selected charging spot." },
  { icon: QrCode, title: "Scan & Connect", desc: "Scan the host QR code or initiate session to start charging instantly." },
  { icon: Zap, title: "Charge", desc: "Plug in your EV two-wheeler and charge at the verified outlet." },
  { icon: CreditCard, title: "Pay", desc: "Pay digitally based on actual charging time. Transparent with zero hidden fees." },
  { icon: Star, title: "Rate & Continue", desc: "Rate your session host and continue your journey with confidence." },
];

const hostSteps = [
  { icon: Home, title: "Register as Host", desc: "Sign up on ChargePush Host and list your charging outlet details." },
  { icon: DollarSign, title: "Set Your Rates", desc: "Choose your session rate per 10 minutes and set your availability schedule." },
  { icon: BadgeCheck, title: "Get Verified", desc: "Complete identity and outlet safety verification." },
  { icon: Users, title: "Accept Requests", desc: "Nearby riders discover your charging spot, book, and charge." },
  { icon: TrendingUp, title: "Earn Revenue", desc: "Earn from usage every time a rider charges at your spot." },
  { icon: Wallet, title: "Receive Payouts", desc: "Track earnings live in your dashboard with direct payouts." },
];

function StepTimeline({ steps, color }: { steps: typeof riderSteps; color: "primary" | "green" }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="reveal flex gap-6 relative" style={{ transitionDelay: `${i * 0.1}s` }}>
            {i < steps.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-full bg-primary/20" />
            )}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 shadow-md gradient-primary">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="pb-10">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-primary">
                Step {i + 1}
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground font-medium">{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HowItWorks() {
  useScrollReveal();

  return (
    <div className="pt-24">
      <SEO 
        title="How ChargePush Works — Charge. Push. Go."
        description="Learn how to find charging spots, book sessions, and power your neighborhood as a host on The ChargePush Network."
      />
      {/* Hero */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display font-black text-3xl md:text-5xl text-white mb-4">
            How ChargePush Works
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto font-medium">
            Charge. Push. Go. Simple, transparent, and built to keep your journey moving.
          </p>
        </div>
      </section>

      {/* Two Timelines */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Rider */}
            <div>
              <div className="mb-10 reveal">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                  <Zap className="w-4 h-4" /> For Riders
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl text-foreground">
                  Find, Charge, and Keep Moving
                </h2>
              </div>
              <StepTimeline steps={riderSteps} color="primary" />
            </div>

            {/* Host */}
            <div>
              <div className="mb-10 reveal">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-primary text-sm font-bold mb-4">
                  <Home className="w-4 h-4" /> ChargePush Host
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl text-foreground">
                  Power Your Neighborhood
                </h2>
              </div>
              <StepTimeline steps={hostSteps} color="green" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4 reveal">
            Built on Trust
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-12 reveal font-medium">
            Every interaction on ChargePush is designed to be safe, fair, and transparent.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { title: "Verified Identity", desc: "Hosts and riders go through identity verification." },
              { title: "Two-Way Ratings", desc: "Riders rate hosts and hosts rate riders after every session." },
              { title: "Transparent Rates", desc: "Exact costs shown upfront before booking. Zero surprises." },
            ].map((item, i) => (
              <div key={i} className="reveal p-6 rounded-2xl bg-card border border-border shadow-sm" style={{ transitionDelay: `${i * 0.1}s` }}>
                <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
