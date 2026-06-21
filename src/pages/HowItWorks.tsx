import { MapPin, Search, Navigation, QrCode, Zap, CreditCard, Star, Home, DollarSign, BadgeCheck, Users, TrendingUp, Wallet } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import CTABanner from "@/components/CTABanner";
import SEO from "@/components/SEO";

const riderSteps = [
  { icon: Search, title: "Search", desc: "Open VoltSetu and search for charging spots near your current location." },
  { icon: MapPin, title: "Choose a Spot", desc: "Browse nearby options, compare prices, ratings, and availability." },
  { icon: Navigation, title: "Navigate", desc: "Get directions to the selected charging spot in your neighborhood." },
  { icon: QrCode, title: "Scan QR Code", desc: "Scan the host's QR code to start your charging session instantly." },
  { icon: Zap, title: "Charge", desc: "Plug in your EV two-wheeler and charge at the verified outlet." },
  { icon: CreditCard, title: "Pay", desc: "Pay the exact amount based on your charging time. No hidden costs." },
  { icon: Star, title: "Rate & Review", desc: "Rate the host and share your experience to help other riders." },
];

const hostSteps = [
  { icon: Home, title: "Register", desc: "Sign up as a host and add your property and outlet details." },
  { icon: DollarSign, title: "Set Price", desc: "Choose your per-10-minute rate and set your operating hours." },
  { icon: BadgeCheck, title: "Get Verified", desc: "Complete identity and outlet verification for trust and safety." },
  { icon: Users, title: "Accept Riders", desc: "Riders discover your spot, book, and arrive for charging." },
  { icon: TrendingUp, title: "Earn", desc: "Earn money for every charging session completed at your outlet." },
  { icon: Wallet, title: "Withdraw", desc: "Receive weekly payouts directly to your bank account." },
];

function StepTimeline({ steps, color }: { steps: typeof riderSteps; color: "primary" | "green" }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="reveal flex gap-6 relative" style={{ transitionDelay: `${i * 0.1}s` }}>
            {i < steps.length - 1 && (
              <div className={`absolute left-6 top-16 w-0.5 h-full ${color === "primary" ? "bg-primary/20" : "bg-ev-green/20"}`} />
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 shadow-md ${color === "primary" ? "gradient-primary" : "gradient-green"}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="pb-10">
              <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${color === "primary" ? "text-primary" : "text-ev-green"}`}>
                Step {i + 1}
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
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
        title="How VoltSetu Works — Step-by-Step Guide for Riders & Hosts"
        description="Learn how to find charging spots, book sessions, and earn passive income. Our step-by-step guide explains everything you need to know about India's hyperlocal EV charging network."
      />
      {/* Hero */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-white mb-4">
            How VoltSetu Works
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Whether you are a rider looking to charge or a homeowner looking to earn, the process is simple, transparent, and built for trust.
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" /> For Riders
                </div>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                  Find, Charge, and Go
                </h2>
              </div>
              <StepTimeline steps={riderSteps} color="primary" />
            </div>

            {/* Host */}
            <div>
              <div className="mb-10 reveal">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ev-green/10 text-ev-green text-sm font-medium mb-4">
                  <Home className="w-4 h-4" /> For Hosts
                </div>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                  List, Host, and Earn
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
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4 reveal">
            Built on Trust
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-12 reveal">
            Every interaction on VoltSetu is designed to be safe, fair, and transparent.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { title: "Verified Identities", desc: "All hosts and riders go through KYC verification." },
              { title: "Two-Way Ratings", desc: "Riders rate hosts and hosts rate riders after every session." },
              { title: "Transparent Pricing", desc: "Exact costs shown upfront. No hidden charges ever." },
            ].map((item, i) => (
              <div key={i} className="reveal p-6 rounded-2xl bg-card border border-border shadow-sm" style={{ transitionDelay: `${i * 0.1}s` }}>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
