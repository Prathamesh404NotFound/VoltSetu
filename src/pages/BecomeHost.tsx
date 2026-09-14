import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, DollarSign, Shield, Users, Clock, CheckCircle, ArrowRight, Phone, MessageCircle, QrCode, BadgeCheck, Zap, TrendingUp } from "lucide-react";
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
  { icon: Home, title: "Register Your Home", desc: "Sign up and add your address, outlet type, and photos." },
  { icon: DollarSign, title: "Set Your Pricing", desc: "Choose your rate per 10 minutes and set availability hours." },
  { icon: BadgeCheck, title: "Get Verified", desc: "Our team verifies your identity and outlet safety." },
  { icon: QrCode, title: "Receive Your QR Code", desc: "Get a unique QR code for riders to scan and start sessions." },
  { icon: TrendingUp, title: "Start Earning", desc: "Riders discover your spot and you earn with every charge." },
];

const hostFaqs = [
  { q: "What kind of outlet do I need?", a: "A standard 3-pin or 5-amp socket is sufficient for most EV two-wheelers. We verify the outlet safety during onboarding." },
  { q: "Is my property insured?", a: "ChargePush provides basic coverage for any damage during charging sessions. Hosts are protected through our trust and safety program." },
  { q: "Can I pause my listing?", a: "Yes, you can toggle your availability anytime. You have full control over your schedule and pricing." },
  { q: "How do I receive payments?", a: "Earnings are deposited directly to your bank account weekly. You can track all transactions in the host dashboard." },
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

  return (
    <div className="pt-24">
      <SEO 
        title="ChargePush Host — Power Your Neighborhood"
        description="List your charging access on The ChargePush Network. Set your own rates, control availability, and earn revenue while providing charging access to nearby EV riders."
      />
      {/* Hero */}
      <section className="relative py-20 gradient-hero overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-bold mb-6">
                <Zap className="w-4 h-4" /> ChargePush Host
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl text-white leading-tight mb-6">
                Power Your Neighborhood with <span className="text-gradient">ChargePush Host</span>
              </h1>
              <p className="text-lg text-white/70 max-w-lg mb-8 leading-relaxed font-medium">
                List your charging access on The ChargePush Network and earn revenue when EV riders charge at your spot. Simple setup, full control over availability.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleRegisterNow}
                  className="px-8 py-4 rounded-xl gradient-primary text-white font-bold text-lg shadow-xl hover:opacity-90 transition-all flex items-center gap-2 btn-forward"
                >
                  Power Your Neighborhood <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <img src={hostImg} alt="ChargePush host" className="rounded-3xl shadow-2xl w-full animate-float object-cover" loading="lazy" width={1280} height={720} />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
              Why Become a ChargePush Host
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, title: "Earn Revenue", description: "Turn spare electrical capacity into regular usage earnings." },
              { icon: Shield, title: "Safe & Verified", description: "Identity checks and rating system protect hosts and riders." },
              { icon: Users, title: "Local Riders", description: "Connect with local EV riders who need charging access." },
              { icon: Clock, title: "Flexible Schedule", description: "Control exactly when your charging access is available." },
              { icon: Zap, title: "Zero Hardware Lock-in", description: "Standard sockets and charging outlets work effortlessly." },
              { icon: CheckCircle, title: "Complete Control", description: "Set your pricing per session and accept requests on your terms." },
            ].map((f, i) => (
              <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <FeatureCard {...f} variant="gradient" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Step Onboarding */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 reveal">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
              Join The Network in 5 Simple Steps
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="reveal flex gap-6 relative group" style={{ transitionDelay: `${i * 0.15}s` }}>
                  {i < steps.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-full bg-border" />
                  )}
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 relative z-10 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="pb-12 flex-1 p-4 -ml-4 rounded-2xl group-hover:bg-card/60 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Step {i + 1}</span>
                      <span className="h-px flex-1 bg-border/60" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
                  </div>
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
              Estimated Usage Calculator
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto font-medium">Estimate your potential earnings based on custom rates and session volume.</p>
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
                Complete host registration — share your location, socket setup, and pricing rules. It takes less than 5 minutes to submit your listing.
              </p>
            </div>

            <Button
              onClick={handleRegisterNow}
              className="px-10 py-4 rounded-xl gradient-primary text-white font-bold text-lg shadow-xl hover:opacity-90 transition-all flex items-center gap-2 mx-auto btn-forward"
            >
              Power Your Neighborhood <ArrowRight className="w-5 h-5" />
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

      <CTABanner variant="dark" title="Ready to Power Your Neighborhood?" subtitle="Join verified hosts offering charging access on The ChargePush Network." />

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
