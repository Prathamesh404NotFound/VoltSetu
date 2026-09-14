import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Zap, Shield, Clock, Home, DollarSign, Users, CheckCircle, Sparkles, TrendingUp, Leaf, Loader2 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import riderImg from "@/assets/rider-app.jpg";
import StatsCounter from "@/components/StatsCounter";

import ParallaxHero from "@/components/landing/ParallaxHero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import SpotCard from "@/components/SpotCard";
import FeatureCard from "@/components/FeatureCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import FAQAccordion from "@/components/FAQAccordion";
import CTABanner from "@/components/CTABanner";
import PlanMyChargeSection from "@/components/PlanMyChargeSection";
import { useState, useEffect } from "react";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import BookingModal from "@/components/BookingModal";
import { useAuth } from "@/components/Auth/AuthProvider";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import SEO from "@/components/SEO";

const Index = () => {
  useScrollReveal();
  const { user } = useAuth();
  const [featuredSpots, setFeaturedSpots] = useState<any[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does ChargePush work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ChargePush connects EV riders with nearby charging access from home hosts, local charging spots, and charging networks. Riders find charging, compare options, navigate, book, charge, and continue their journey."
        }
      },
      {
        "@type": "Question",
        "name": "How much does it cost to charge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pricing is set transparently by hosts and network providers based on local power rates and availability. You can see exact pricing on each charging spot before you book."
        }
      },
      {
        "@type": "Question",
        "name": "Is it safe to charge at host locations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All ChargePush hosts undergo identity verification and outlet safety checks. Our rating system ensures high quality and trust across the network."
        }
      },
      {
        "@type": "Question",
        "name": "How do I become a ChargePush Host?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Suitable home hosts and local spot owners can list their charging access on ChargePush Host, set their own rates and availability, and earn from rider usage."
        }
      }
    ]
  };

  useEffect(() => {
    getAllChargingSpots().then(spots => {
      setFeaturedSpots(spots.slice(0, 3));
    }).finally(() => {
      setLoadingSpots(false);
    });
  }, []);

  const handleBookNow = (spot: any) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setSelectedSpot(spot);
    }
  };

  const heroSection = <ParallaxHero />;
  const statsSection = <StatsCounter />;

  const trustStrip = (
    <section aria-label="Network trust highlights" className="relative z-10 -mt-8 lg:-mt-12">
      <div className="page-shell">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border shadow-xl sm:grid-cols-4">
          <div className="flex flex-col items-start gap-1 bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /> Active spots</div>
            <div className="text-2xl font-bold text-foreground">
              {loadingSpots ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (featuredSpots.length || '—')}
            </div>
            <div className="text-xs text-muted-foreground">Nearby charging access</div>
          </div>
          <div className="flex flex-col items-start gap-1 bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><Shield className="h-3.5 w-3.5 text-primary" /> Verified Host</div>
            <div className="text-2xl font-bold text-foreground">Identity Checked</div>
            <div className="text-xs text-muted-foreground">Safety verified hosts</div>
          </div>
          <div className="flex flex-col items-start gap-1 bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><Zap className="h-3.5 w-3.5 text-primary" /> Transparent</div>
            <div className="text-2xl font-bold text-foreground">Clear Pricing</div>
            <div className="text-xs text-muted-foreground">No hidden charges</div>
          </div>
          <div className="flex flex-col items-start gap-1 bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><Users className="h-3.5 w-3.5 text-primary" /> Network</div>
            <div className="text-2xl font-bold text-foreground">ChargePush</div>
            <div className="text-xs text-muted-foreground">Distributed access</div>
          </div>
        </div>
      </div>
    </section>
  );

  const howItWorksSection = (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16 reveal">
          <h2 className="font-display font-black text-3xl md:text-5xl text-foreground mb-4">
            How ChargePush Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Charge. Push. Go. Simple, transparent, and energetic.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Rider Flow */}
          <div className="reveal p-8 md:p-10 rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-display font-bold text-2xl text-card-foreground mb-4">For Riders</h3>
            <div className="space-y-4">
              {["Find nearby charging access on the map", "Compare pricing, distance, and outlet types", "Book your charging session instantly", "Charge and continue your journey with confidence"].map((step, i) => (
                <div key={i} className="flex items-start gap-4 text-[15px] text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-tight pt-1 font-medium">{step}</span>
                </div>
              ))}
            </div>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 text-primary font-bold mt-8 hover:gap-3 transition-all btn-forward">
              How It Works <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          {/* Host Flow */}
          <div className="reveal p-8 md:p-10 rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 group" style={{ transitionDelay: "0.1s" }}>
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display font-bold text-2xl text-card-foreground mb-4">For Hosts</h3>
            <div className="space-y-4">
              {["List your home or local charging access", "Set custom rates and availability hours", "Accept charging requests from EV riders", "Earn revenue while supporting local mobility"].map((step, i) => (
                <div key={i} className="flex items-start gap-4 text-[15px] text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-tight pt-1 font-medium">{step}</span>
                </div>
              ))}
            </div>
            <Link to="/host" className="inline-flex items-center gap-2 text-primary font-bold mt-8 hover:gap-3 transition-all btn-forward">
              Power Your Neighborhood <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );

  const riderBenefitsSection = (
    <section className="py-20 lg:py-24 bg-soft-gray">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16 reveal">
          <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
            Why Riders Choose ChargePush
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">Confidence to keep moving wherever your journey takes you.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { icon: MapPin, title: "Nearby Access", description: "Find verified charging spots nearby when you need power most." },
            { icon: Clock, title: "Instant Booking", description: "Reserve your charging slot in seconds and navigate directly." },
            { icon: DollarSign, title: "Transparent Rates", description: "Compare prices upfront before booking with zero hidden charges." },
            { icon: Zap, title: "Reliable Power", description: "Charge safely at verified home outlets and network stations." },
          ].map((f, i) => (
            <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <FeatureCard {...f} variant="gradient" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const hostBenefitsSection = (
    <section className="py-20 lg:py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="reveal-left order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl blur-2xl animate-pulse" />
            <img
              src={riderImg}
              alt="Rider using ChargePush app"
              className="relative rounded-3xl shadow-2xl object-cover w-full max-h-[600px]"
              loading="lazy"
            />
          </div>
          <div className="reveal-right order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold mb-6">
              <Zap className="w-4 h-4" /> ChargePush Host
            </div>
            <h2 className="font-display font-black text-3xl md:text-4xl lg:text-5xl text-foreground mb-6 leading-tight">
              Power Your Neighborhood
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Become an active node in The ChargePush Network. List your charging access, set your rules, accept requests, and earn revenue from usage while expanding local electric mobility access.
            </p>
            <div className="space-y-5">
              {[
                { icon: TrendingUp, text: "Earn income from your existing electrical setup" },
                { icon: Shield, text: "Identity-verified riders and rating system" },
                { icon: Users, text: "Connect with electric riders in your community" },
                { icon: Clock, text: "Full control over your availability schedule" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-foreground font-semibold text-[17px]">{text}</span>
                </div>
              ))}
            </div>
            <Link
              to="/host"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl gradient-primary text-white font-bold text-lg mt-10 hover:opacity-90 transition-all shadow-xl hover:shadow-primary/30 btn-forward"
            >
              Power Your Neighborhood <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );

  const featuredSpotsSection = (
    <section className="py-20 lg:py-24 bg-soft-gray border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 reveal">
          <div className="max-w-2xl">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-3">
              Featured Charging Access
            </h2>
            <p className="text-muted-foreground text-lg">Nearby verified spots ready for booking.</p>
          </div>
          <Link to="/spots" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-full btn-forward">
            Find a Charge Map <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingSpots ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p>Loading charging access points...</p>
          </div>
        ) : featuredSpots.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No spots listed yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to list charging access in your neighborhood!</p>
            <Link to="/host" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-bold hover:opacity-90 transition-all shadow-md btn-forward">
              Power Your Neighborhood
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featuredSpots.map((spot, i) => (
              <div key={spot.id || i} className="reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                <SpotCard
                  id={spot.id}
                  name={spot.name}
                  host={spot.hostName}
                  hostId={spot.hostId}
                  hostPhone={spot.hostPhone}
                  distance="0.8 km"
                  pricePerHour={spot.pricePerHour}
                  rating={(!spot.reviews?.length && !spot.totalCharges) ? null : spot.rating}
                  reviews={spot.reviews?.length || spot.totalCharges || 0}
                  isVerified={spot.isVerified}
                  isFeatured={i === 0}
                  outletType={spot.outletType}
                  availableHours={spot.availableHours}
                  amenities={spot.amenities}
                  image={spot.photos?.[0]}
                  onBook={() => setSelectedSpot(spot)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const electricNightSection = (
    <section className="relative py-24 lg:py-32 gradient-hero grain overflow-hidden" aria-label="ChargePush network coverage">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 charge-line" />
        <div className="absolute top-[30%] left-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center reveal mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm mb-6">
            <Zap className="w-4 h-4 text-primary" /> The ChargePush Network
          </div>
          <h2 className="font-display font-black display-tight text-4xl md:text-6xl text-white text-balance">
            Charge. Push. Go. <span className="text-gradient">Keep Moving.</span>
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mt-5 font-medium">
            Charging is what keeps the journey moving. ChargePush powers distributed charging access so riders never stop.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 reveal">
          {[
            { stat: "Direct Access", caption: "Find nearby charging access points in your neighborhood" },
            { stat: "Transparent", caption: "Host-set rates shown upfront before booking" },
            { stat: "Real-Time", caption: "Live status indicator — Available, Occupied, or Paused" },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="font-display font-bold text-3xl text-white mb-3 tracking-tight">{item.stat}</div>
              <p className="text-white/60 text-sm leading-relaxed">{item.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const whyChooseUsSection = (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16 reveal">
          <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
            Why Choose ChargePush
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">Confidence to keep moving with modern electric mobility tech.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { icon: Shield, title: "Verified & Safe", description: "Identity and hardware verified hosts for absolute safety." },
            { icon: TrendingUp, title: "Expanding Access", description: "A growing network of home hosts, local spots, and charging networks." },
            { icon: Leaf, title: "Electric Mobility", description: "Keeping riders moving with zero charging anxiety." },
            { icon: Users, title: "Community Built", description: "Powered by mutual host-rider trust, ratings, and instant bookings." },
          ].map((f, i) => (
            <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <FeatureCard {...f} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const testimonialsSection = (
    <div className="reveal">
      <TestimonialCarousel />
    </div>
  );

  const faqSection = (
    <section className="py-20 lg:py-28 bg-soft-gray">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12 lg:mb-16 reveal">
          <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">Everything you need to know about charging and hosting on ChargePush.</p>
        </div>
        <div className="reveal bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border">
          <FAQAccordion />
        </div>
      </div>
    </section>
  );

  const ctaSection = <CTABanner variant="dark" />;
  const planMyChargeSection = <PlanMyChargeSection />;

  return (
    <div className="overflow-hidden">
      <SEO 
        title="ChargePush — Charge. Push. Go. | EV Charging Network"
        description="ChargePush is a distributed EV charging-access network connecting riders with nearby home hosts and charging spots. Keep moving."
        schema={faqSchema}
      />
      {heroSection}
      {trustStrip}
      <FeatureGrid />

      {user ? (
        <>
          {featuredSpotsSection}
          {planMyChargeSection}
          {statsSection}
          {howItWorksSection}
          {riderBenefitsSection}
          {hostBenefitsSection}
          {electricNightSection}
          {whyChooseUsSection}
          {testimonialsSection}
          {faqSection}
          {ctaSection}
        </>
      ) : (
        <>
          {statsSection}
          {howItWorksSection}
          {riderBenefitsSection}
          {hostBenefitsSection}
          {featuredSpotsSection}
          {planMyChargeSection}
          {electricNightSection}
          {whyChooseUsSection}
          {testimonialsSection}
          {faqSection}
          {ctaSection}
        </>
      )}

      {selectedSpot && (
        <BookingModal
          isOpen={!!selectedSpot}
          onClose={() => setSelectedSpot(null)}
          spot={selectedSpot}
        />
      )}

      {showLoginModal && (
        <GoogleLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};

export default Index;
