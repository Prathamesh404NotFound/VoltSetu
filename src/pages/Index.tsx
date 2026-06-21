import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Zap, Shield, Clock, Home, DollarSign, Users, CheckCircle, Sparkles, TrendingUp, Leaf, Loader2 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import heroImg from "@/assets/hero-charging.jpg";
import riderImg from "@/assets/rider-app.jpg";
import StatsCounter from "@/components/StatsCounter";
import SpotCard from "@/components/SpotCard";
import FeatureCard from "@/components/FeatureCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import FAQAccordion from "@/components/FAQAccordion";
import CTABanner from "@/components/CTABanner";
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
        "name": "How does VoltSetu work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "VoltSetu connects EV two-wheeler riders with nearby home charging spots. Riders search for a spot, navigate to it, plug in, and pay based on charging time. Homeowners list their outlet and earn money each time a rider charges."
        }
      },
      {
        "@type": "Question",
        "name": "How much does it cost to charge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pricing is set by individual hosts, typically ranging from Rs 5 to Rs 15 per 10 minutes. You can see the exact price on each charging spot listing before you book."
        }
      },
      {
        "@type": "Question",
        "name": "Is it safe to charge at someone's home?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All hosts go through a verification process. We verify identity, outlet safety, and location details. Riders and hosts both have rating systems to maintain community trust."
        }
      },
      {
        "@type": "Question",
        "name": "How much can I earn as a host?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Earnings depend on your area's demand and pricing. On average, hosts earn Rs 2,000 to Rs 5,000 per month with minimal effort. You set your own rates and availability."
        }
      }
    ]
  };

  useEffect(() => {
    getAllChargingSpots().then(spots => {
      // Pick top 3 rated or latest spots as featured
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

  const handleFindSpots = () => {
    // Navigate to find spots page
    window.location.href = '/spots';
  };

  const handleBecomeHost = () => {
    // Navigate to become host page
    window.location.href = '/host';
  };

  const heroSection = (
    <section className="relative min-h-[90vh] flex items-center pt-24 gradient-hero overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-ev-green/15 rounded-full blur-3xl animate-blob-delayed" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-blob-delayed-2" />

      <div className="container mx-auto px-4 relative z-10 py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="animate-slide-up text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm mb-6 max-w-fit mx-auto lg:mx-0">
              <Sparkles className="w-4 h-4 text-primary" />
              India's Hyperlocal EV Charging Network
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
              {user ? (
                <>
                  Welcome back — find your{" "}
                  <span className="text-gradient block mt-2 lg:inline lg:mt-0">next charge</span>
                </>
              ) : (
                <>
                  Find Nearby EV Charging Spots or{" "}
                  <span className="text-gradient block mt-2 lg:inline lg:mt-0">Earn from Your Home</span>
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              Charge your EV two-wheeler at verified home charging points near you. Or list your home outlet and start earning passive income from every charge.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <button
                onClick={handleFindSpots}
                className="px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-lg shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" /> Find a Spot
              </button>
              <button
                onClick={handleBecomeHost}
                className="px-8 py-4 rounded-xl bg-white/10 text-white border border-white/20 font-semibold text-lg hover:bg-white/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> Register Your Home
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-8 text-white/60 text-sm font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-ev-green" /> Free to Join</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-ev-green" /> Verified Hosts</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-ev-green" /> Pay per Use</span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20 scale-90" />
            <img
              src={heroImg}
              alt="EV scooter charging at a home outlet"
              className="relative rounded-3xl shadow-2xl w-full animate-float object-cover h-[500px]"
              fetchPriority="high"
            />
            <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-xl animate-float-delayed">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Charging Active</div>
                  <div className="text-xs text-muted-foreground">Rs 10 / 10 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const statsSection = <StatsCounter />;

  const howItWorksSection = (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16 reveal">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            How VoltSetu Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Simple, transparent, and built for India's neighborhoods.
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
              {["Search nearby charging spots on the map", "Navigate seamlessly to the location", "Plug in your EV and charge securely", "Pay digitally based on time spent"].map((step, i) => (
                <div key={i} className="flex items-start gap-4 text-[15px] text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-tight pt-1">{step}</span>
                </div>
              ))}
            </div>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 text-primary font-semibold mt-8 hover:gap-3 transition-all">
              Learn more <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          {/* Host Flow */}
          <div className="reveal p-8 md:p-10 rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 group" style={{ transitionDelay: "0.1s" }}>
            <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Home className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-display font-bold text-2xl text-card-foreground mb-4">For Hosts</h3>
            <div className="space-y-4">
              {["Register your home outlet details", "Set your own pricing & availability", "Get verified instantly by our team", "Start earning passive income effortlessly"].map((step, i) => (
                <div key={i} className="flex items-start gap-4 text-[15px] text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-ev-green/10 text-ev-green text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-tight pt-1">{step}</span>
                </div>
              ))}
            </div>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 text-ev-green font-semibold mt-8 hover:gap-3 transition-all">
              Learn more <ArrowRight className="w-5 h-5" />
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
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Why Riders Love VoltSetu
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">Everything you need for a stress-free EV life.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { icon: MapPin, title: "Nearby Access", description: "Find charging spots within walking distance, right in your neighborhood." },
            { icon: Clock, title: "Easy Booking", description: "Book a spot in seconds. Navigate, plug in, and start charging immediately." },
            { icon: DollarSign, title: "Transparent Pricing", description: "See exact pricing before you book. No hidden fees, no surprises." },
            { icon: Zap, title: "Fast Charging", description: "Charge your EV two-wheeler quickly at verified, safe home outlets." },
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
            <div className="absolute inset-0 bg-gradient-to-tr from-ev-green/20 to-transparent rounded-3xl blur-2xl animate-pulse" />
            <img
              src={riderImg}
              alt="Rider using VoltSetu app"
              className="relative rounded-3xl shadow-2xl object-cover w-full max-h-[600px]"
              loading="lazy"
            />
          </div>
          <div className="reveal-right order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ev-green/10 text-ev-green text-sm font-semibold mb-6">
              <DollarSign className="w-4 h-4" /> Earn with VoltSetu
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-6 leading-tight">
              Turn your outlet into <br className="hidden lg:block" /> a revenue stream
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Turn your home electricity outlet into a revenue-generating charging point. Set your own prices, choose your availability, and earn money while helping EV riders.
            </p>
            <div className="space-y-5">
              {[
                { icon: TrendingUp, text: "Earn Rs 2,000 - Rs 5,000+ monthly" },
                { icon: Shield, text: "Verified riders and insured platform" },
                { icon: Users, text: "Tap into a growing community in your area" },
                { icon: Clock, text: "100% Flexible hours - you decide when" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-ev-green/10 group-hover:bg-ev-green/20 transition-colors flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-ev-green" />
                  </div>
                  <span className="text-foreground font-medium text-[17px]">{text}</span>
                </div>
              ))}
            </div>
            <Link
              to="/host"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl gradient-green text-white font-semibold text-lg mt-10 hover:opacity-90 transition-all shadow-xl hover:shadow-ev-green/30 hover:-translate-y-1"
            >
              Register as Host <ArrowRight className="w-5 h-5" />
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
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
              Featured Charging Spots
            </h2>
            <p className="text-muted-foreground text-lg">Top-rated spots ready for booking in your area.</p>
          </div>
          <Link to="/spots" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-full">
            View All Map <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingSpots ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p>Loading top spots...</p>
          </div>
        ) : featuredSpots.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No spots available yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to host in your area!</p>
            <Link to="/host" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-green text-white font-semibold hover:opacity-90 transition-all shadow-md">
              Become a Host
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
                  hostPhone={spot.hostPhone}
                  distance="0.8 km"
                  pricePerHour={spot.pricePerHour}
                  rating={(!spot.reviews?.length && !spot.totalCharges) ? null : spot.rating}
                  reviews={spot.reviews?.length || spot.totalCharges || 0}
                  isVerified={spot.isVerified}
                  isFeatured={i === 0}
                  outletType={spot.outletType}
                  availableHours={spot.availableHours}
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

  const whyChooseUsSection = (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16 reveal">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Why Choose VoltSetu
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">Building the foundation for India's EV future.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { icon: Shield, title: "Verified & Safe", description: "Every host goes through identity and outlet hardware verification for absolute safety." },
            { icon: TrendingUp, title: "Rapidly Growing", description: "A rapidly expanding network ensuring you always have a plug nearby." },
            { icon: Leaf, title: "Eco-Friendly", description: "Supporting India's clean mobility transition by making EVs practical for everyone." },
            { icon: Users, title: "Community Driven", description: "Built on mutual ratings, reviews, and a shared mission to reduce emissions." },
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
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">Everything you need to know about charging and hosting on VoltSetu.</p>
        </div>
        <div className="reveal bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border">
          <FAQAccordion />
        </div>
      </div>
    </section>
  );

  const ctaSection = <CTABanner variant="dark" />;

  return (
    <div className="overflow-hidden">
      <SEO 
        title="VoltSetu — Find EV Charging Spots Near You in Kolhapur"
        description="Book nearby EV two-wheeler charging spots instantly in Kolhapur, or list your outlet and earn passive income as a host. Join India's hyperlocal charging network."
        schema={faqSchema}
      />
      {heroSection}

      {user ? (
        <>
          {featuredSpotsSection}
          {statsSection}
          {howItWorksSection}
          {riderBenefitsSection}
          {hostBenefitsSection}
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
