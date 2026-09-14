import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, DollarSign, Shield, Eye, Clock, CheckCircle, ArrowRight, BadgeCheck, Zap, Sliders, ShieldCheck } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useAuth } from "@/components/Auth/AuthProvider";
import hostImg from "@/assets/host-homeowner.jpg";
import FeatureCard from "@/components/FeatureCard";
import FAQAccordion from "@/components/FAQAccordion";
import CTABanner from "@/components/CTABanner";
import HostRegistrationModal from "@/components/HostRegistration/HostRegistrationModal";
import EarningsEstimator from "@/components/EarningsEstimator";
import { Button } from "@/components/ui/button";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import SEO from "@/components/SEO";

const steps = [
  { icon: Home, title: "LIST", desc: "Set up your charging spot." },
  { icon: ShieldCheck, title: "VERIFY", desc: "Complete required verification." },
  { icon: Sliders, title: "HOST", desc: "Choose availability and pricing." },
  { icon: DollarSign, title: "EARN", desc: "Receive earnings from eligible charging sessions." },
];

const pillars = [
  { icon: Sliders, title: "Control", description: "Choose availability on your terms." },
  { icon: Eye, title: "Visibility", description: "Get discovered by riders looking for nearby charging." },
  { icon: Shield, title: "Trust", description: "Use verification and marketplace controls to manage access." },
  { icon: DollarSign, title: "Earnings", description: "Earn from eligible sessions based on actual usage." },
];

const hostFaqs = [
  { q: "What kind of outlet do I need?", a: "A standard 3-pin socket or dedicated charger is suitable for EV two-wheelers and vehicles. We review your setup during verification." },
  { q: "How does verification work?", a: "Your listing is reviewed before it is shown as verified to ensure safety and accuracy for riders." },
  { q: "Can I pause my listing?", a: "Yes. You can pause your listing at any time or set specific available hours so riders only request when you are open." },
  { q: "How do payouts work?", a: "Earnings from completed, eligible charging sessions are processed directly to your payout account." },
];

export default function BecomeHost() {
  useScrollReveal();
  const { user } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleRegisterNow = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setShowRegistrationModal(true);
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="pt-24">
      <SEO 
        title="ChargePush Host — Your Power Can Keep Someone Moving"
        description="Turn suitable charging access at your property into part of the ChargePush network. Control availability, set pricing, and earn from eligible charging sessions."
      />
      {/* Hero */}
      <section className="relative py-20 gradient-hero overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-bold mb-6">
                <Zap className="w-4 h-4" /> Power Your Neighborhood
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl text-white leading-tight mb-6">
                Your power can keep someone moving.
              </h1>
              <p className="text-lg text-white/70 max-w-lg mb-8 leading-relaxed font-medium">
                Turn suitable charging access at your property into part of the ChargePush network. List suitable charging access, control when it is available, and earn from eligible charging sessions.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleRegisterNow}
                  className="px-8 py-4 rounded-xl gradient-primary text-white font-bold text-lg shadow-xl hover:opacity-90 transition-all flex items-center gap-2 btn-forward"
                >
                  Become a Host <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  onClick={scrollToHowItWorks}
                  variant="outline"
                  className="px-8 py-4 rounded-xl border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all"
                >
                  See How It Works
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <img src={hostImg} alt="ChargePush Host Spot" className="rounded-3xl shadow-2xl w-full animate-float object-cover" loading="lazy" width={1280} height={720} />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
              Host Value Proposition
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto font-medium">
              Join a host community building essential neighborhood EV charging access.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((f, i) => (
              <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <FeatureCard icon={f.icon} title={f.title} description={f.description} variant="gradient" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Onboarding */}
      <section id="how-it-works" className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary block mb-2">Simple Process</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
              How Hosting Works
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="reveal bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col items-start relative group hover:border-primary/40 transition-colors" style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white mb-4 font-bold shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Step {i + 1}</span>
                  <h3 className="font-display font-bold text-xl text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Earnings Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
              Estimated Session Calculator
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto font-medium">Estimate potential revenue based on your chosen hourly/session rate and charging volume.</p>
          </div>
          <div className="max-w-3xl mx-auto reveal">
            <EarningsEstimator />
          </div>
        </div>
      </section>

      {/* Registration CTA */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="reveal bg-card rounded-3xl border border-border p-10 shadow-lg text-center space-y-6">
            <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Home className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-3">
                Power Your Neighborhood
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
                List suitable charging access, control when it is available, and earn from eligible charging sessions.
              </p>
            </div>

            <Button
              onClick={handleRegisterNow}
              className="px-10 py-4 rounded-xl gradient-primary text-white font-bold text-lg shadow-xl hover:opacity-90 transition-all flex items-center gap-2 mx-auto btn-forward"
            >
              Become a Host <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">Host FAQ</h2>
          </div>
          <div className="reveal">
            <FAQAccordion faqs={hostFaqs} />
          </div>
        </div>
      </section>

      <CTABanner variant="dark" title="Your power can keep someone moving." subtitle="Join verified hosts offering charging access on The ChargePush Network." />

      {/* Modals */}
      <HostRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />
      <GoogleLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

