import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  MapPin, 
  Zap, 
  Shield, 
  Clock, 
  Home, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Loader2,
  Navigation,
  AlertTriangle,
  Compass,
  Layers,
  HeartHandshake,
  ShieldCheck,
  Check
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import riderImg from "@/assets/rider-app.jpg";
import spotsMapImg from "@/assets/spots-map.jpg";
import hostHomeownerImg from "@/assets/host-homeowner.jpg";
import aboutCommunityImg from "@/assets/about-community.jpg";

import SpotCard from "@/components/SpotCard";
import SpotCardSkeleton from "@/components/SpotCardSkeleton";
import FeatureCard from "@/components/FeatureCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import FAQAccordion from "@/components/FAQAccordion";
import CTABanner from "@/components/CTABanner";
import BookingModal from "@/components/BookingModal";
import { useAuth } from "@/components/Auth/AuthProvider";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import SEO from "@/components/SEO";
import { useSpots } from "@/hooks/useSpots";

const Index = () => {
  useScrollReveal();
  const { user } = useAuth();
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Reuse the same React Query cache as FindSpots — zero extra Firebase reads
  const { data: allSpots = [], isLoading: loadingSpots } = useSpots();
  const featuredSpots = allSpots.slice(0, 3);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is ChargePush?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ChargePush is a distributed EV charging-access network and marketplace connecting EV riders with nearby charging access from home hosts, local charging spots, and charging networks."
        }
      },
      {
        "@type": "Question",
        "name": "How do I find a charge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Open the Find a Charge map to discover nearby spots, compare pricing and distance, navigate directly, and charge."
        }
      },
      {
        "@type": "Question",
        "name": "How do hosts join ChargePush?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Homeowners and local spot owners click Power Your Neighborhood, list their charging access, set their rules, and receive earnings from usage."
        }
      }
    ]
  };


  // 1. MOBILITY-FIRST HERO
  const heroSection = (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-slate-100/90 via-blue-50/40 to-[#F4F6F9] overflow-hidden border-b border-slate-200/80">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-blue-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-[30rem] h-[30rem] bg-cyan-400/15 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold uppercase tracking-widest shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" /> Charge. Push. Go.
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-foreground tracking-tight leading-[1.08]">
              Never Stop <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-500 to-teal-400">
                Moving.
              </span>
            </h1>

            <p className="text-muted-foreground text-lg sm:text-xl max-w-xl font-medium leading-relaxed">
              Find charging access nearby or along your route, charge with confidence, and keep going.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/spots"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl gradient-primary text-white font-bold text-lg hover:opacity-95 transition-all shadow-xl hover:shadow-primary/30 btn-forward"
              >
                <MapPin className="w-5 h-5" /> Find a Charge
              </Link>

              <Link
                to="/host"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white border border-slate-200/90 text-foreground font-bold text-lg hover:bg-slate-50 transition-all shadow-md"
              >
                <Home className="w-5 h-5 text-primary" /> Power Your Neighborhood
              </Link>
            </div>

            {/* Brand Promise line */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold pt-4">
              <div className="flex items-center gap-1.5 text-foreground">
                <CheckCircle className="w-4 h-4 text-primary" /> Low battery should not end the journey
              </div>
              <span>•</span>
              <div className="text-primary font-bold uppercase tracking-wider">Keep Moving</div>
            </div>
          </div>

          {/* Hero Visual: Authentic Indian EV Mobility */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 group">
              <img
                src={riderImg}
                alt="Electric rider using ChargePush on Indian roads"
                width={800}
                height={500}
                fetchPriority="high"
                decoding="async"
                className="w-full h-[420px] sm:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              
              {/* Floating Overlay Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-md">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Neighborhood Charging Access</p>
                      <p className="text-xs text-muted-foreground">Nearby home hosts & charging spots</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Network
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // 2. BRAND TRUST STRIP
  const trustStrip = (
    <section aria-label="Network decision highlights" className="py-8 bg-[#EAF0F6] border-b border-slate-200/80">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Nearby Access</p>
              <p className="text-xs text-muted-foreground">Local charging in your neighborhood</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Verified Availability</p>
              <p className="text-xs text-muted-foreground">Real status & safety check</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Transparent Pricing</p>
              <p className="text-xs text-muted-foreground">Rates displayed upfront before booking</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Route-Ready Charging</p>
              <p className="text-xs text-muted-foreground">Charge along corridors, not after low battery</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // 3. BRAND STORY SECTION
  const brandStorySection = (
    <section className="py-20 lg:py-28 bg-[#F4F6F9] border-b border-slate-200/80">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            Our Purpose
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-foreground">
            Your battery is not the destination.
          </h2>
          <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            ChargePush makes charging access easier to find so your journey can continue without stress, interruptions, or low-battery anxiety.
          </p>

          {/* Visual relationship: rider -> charge -> road */}
          <div className="grid sm:grid-cols-3 gap-6 pt-10 text-left">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/90 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 font-black text-lg mb-4 flex items-center justify-center border border-blue-500/20">1</div>
              <h3 className="font-bold text-lg text-foreground mb-1">Rider Needs Power</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Riders on daily commutes or longer journeys need reliable charging access nearby.</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-blue-50/40 border border-blue-200/80 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-black text-lg mb-4 flex items-center justify-center border border-primary/20">2</div>
              <h3 className="font-bold text-lg text-foreground mb-1">Connect & Charge</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">ChargePush connects riders to verified home hosts, local spots, and commercial stations.</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-emerald-50/40 border border-emerald-200/80 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-lg mb-4 flex items-center justify-center border border-emerald-500/20">3</div>
              <h3 className="font-bold text-lg text-foreground mb-1">Keep Moving</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Plug in, charge with confidence, and continue down the road to your real destination.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // 4. THE NETWORK SECTION
  const networkSection = (
    <section className="py-20 lg:py-28 bg-[#EAF0F6] border-b border-slate-200/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-4 h-4" /> Three Access Layers
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-foreground mb-4">
            Charging should be closer than you think.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
            One unified experience connecting diverse charging sources across your neighborhood and city.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Layer 1 */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-white via-white to-blue-50/40 border border-blue-200/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 border border-primary/20 shadow-xs">
              <Home className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-2xl text-foreground mb-2">Home Hosts</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Residential outlets and private home setups opened by homeowners to support neighborhood riders.
            </p>
            <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Connected through ChargePush
            </span>
          </div>

          {/* Layer 2 */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-white via-white to-cyan-50/40 border border-cyan-200/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-6 border border-cyan-500/20 shadow-xs">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-2xl text-foreground mb-2">Local Spots</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Shops, cafes, societies, and local businesses providing charging access for visitors and community riders.
            </p>
            <span className="inline-block text-xs font-semibold text-cyan-600 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Connected through ChargePush
            </span>
          </div>

          {/* Layer 3 */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-white via-white to-emerald-50/40 border border-emerald-200/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-xs">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-2xl text-foreground mb-2">Network Stations</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Commercial charging networks and fast station hubs integrated into one search map.
            </p>
            <span className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Connected through ChargePush
            </span>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="font-display font-bold text-xl text-foreground">
            One place to find them all.
          </p>
        </div>
      </div>
    </section>
  );

  // 5. RIDER EXPERIENCE SECTION
  const riderExperienceSection = (
    <section className="py-20 lg:py-28 bg-[#F4F6F9] border-b border-slate-200/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            Rider Flow
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-foreground mb-4">
            How ChargePush Works for Riders
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
            Charge. Push. Go. Simple, transparent, and built for your peace of mind.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {[
            { step: "1", title: "FIND", text: "Discover nearby charging access on your map or along your route." },
            { step: "2", title: "CHOOSE", text: "Compare distance, availability, pricing, rating, and outlet types." },
            { step: "3", title: "BOOK", text: "Request a charging session or reserve instant slots." },
            { step: "4", title: "CHARGE", text: "Arrive at the verified host location and plug in safely." },
            { step: "5", title: "GO", text: "Unplug and continue your journey with full confidence." },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/90 shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <span className="w-8 h-8 rounded-lg gradient-primary text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                  {item.step}
                </span>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // 6. ROUTE SECTION
  const routeSection = (
    <section className="py-20 lg:py-28 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4" /> ChargePush Route
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-foreground leading-tight">
              Charge along the way.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
              Plan your journey and find charging spots near your route instead of searching only after your battery gets low.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                <Check className="w-5 h-5 text-primary" /> Enter Start & Destination locations
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                <Check className="w-5 h-5 text-primary" /> Surface verified charging access along corridor
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                <Check className="w-5 h-5 text-primary" /> Stop and charge before anxiety hits
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/route"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl gradient-primary text-white font-bold text-base hover:opacity-90 transition-all shadow-lg btn-forward"
              >
                Plan Your Charge <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-border shadow-xl relative">
              <img
                src={spotsMapImg}
                alt="ChargePush Route planner preview"
                width={640}
                height={360}
                loading="lazy"
                decoding="async"
                className="w-full h-[360px] object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center p-6 text-center">
                <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 max-w-sm">
                  <Navigation className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-bold text-foreground">Corridor Charging Search</p>
                  <p className="text-xs text-muted-foreground mt-1">Discover available host & network chargers directly along your navigation route.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // 7. CHARGING ANXIETY CAMPAIGN SECTION
  const anxietySection = (
    <section className="py-20 lg:py-24 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800">
      <div className="container mx-auto px-4 text-center max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-extrabold uppercase tracking-widest">
          <AlertTriangle className="w-3.5 h-3.5" /> No More Low-Battery Drama
        </div>
        <h2 className="font-display font-black text-4xl sm:text-6xl tracking-tight">
          Low battery. <span className="text-red-400">High drama.</span>
        </h2>
        <p className="text-white/80 text-xl font-medium leading-relaxed">
          Your battery percentage shouldn't decide how your journey ends.
        </p>
        <p className="text-white/60 text-base leading-relaxed max-w-xl mx-auto">
          ChargePush helps you find charging access before a small problem becomes a full stop. Ride with confidence every single day.
        </p>
      </div>
    </section>
  );

  // 8. HOST SECTION & STORY
  const hostSection = (
    <section className="py-20 lg:py-28 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="rounded-3xl overflow-hidden border border-border shadow-xl relative">
              <img
                src={hostHomeownerImg}
                alt="ChargePush Home Host"
                width={800}
                height={450}
                loading="lazy"
                decoding="async"
                className="w-full h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-card/90 backdrop-blur-md border border-border">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Host Marketplace Story</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  Connect your available property outlet with neighborhood riders who need power.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              ChargePush Host
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-foreground leading-tight">
              Your power can keep someone moving.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
              Turn suitable charging access at your property into part of the local charging network.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <p className="font-bold text-foreground text-base mb-1">1. LIST</p>
                <p className="text-xs text-muted-foreground">Set up your charging spot & outlet specifications.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <p className="font-bold text-foreground text-base mb-1">2. VERIFY</p>
                <p className="text-xs text-muted-foreground">Complete host identity & outlet safety check.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <p className="font-bold text-foreground text-base mb-1">3. HOST</p>
                <p className="text-xs text-muted-foreground">Make your charging access available on your terms.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <p className="font-bold text-foreground text-base mb-1">4. EARN</p>
                <p className="text-xs text-muted-foreground">Receive earnings from eligible completed sessions.</p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/host"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-bold text-lg hover:opacity-90 transition-all shadow-xl btn-forward"
              >
                Power Your Neighborhood <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // 9. WHY CHARGEPUSH
  const whyChargePushSection = (
    <section className="py-20 lg:py-28 bg-muted/20 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display font-black text-3xl sm:text-5xl text-foreground mb-4">
            Why ChargePush
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
            Four core principles guiding our network experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Closer</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Charging access closer to everyday life — home hosts, neighborhood spots, and local stops.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-lg mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Clear</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              See relevant details before choosing — distance, pricing, plug type, and host rating upfront.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Connected</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Multiple charging sources — home hosts, local spots, network stations — unified in one map.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-lg mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Keep Moving</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Charging should be a quick, hassle-free stop so your journey always continues.
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // 10. EMERGENCY / RESCUE
  const rescueSection = (
    <section className="py-16 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl bg-card border border-amber-500/30 shadow-lg">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" /> ChargePush Rescue
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
              Battery almost empty?
            </h3>
            <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
              When the journey becomes urgent, ChargePush Rescue helps you find an available charging option nearby.
            </p>
          </div>

          <Link
            to="/rescue"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-all shadow-md shrink-0 btn-forward"
          >
            Get Emergency Charge <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );

  // FEATURED SPOTS SECTION
  const featuredSpotsSection = (
    <section className="py-20 lg:py-24 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-3">
              Nearby Charging Access
            </h2>
            <p className="text-muted-foreground text-lg font-medium">Explore verified charging spots active on the network.</p>
          </div>
          <Link to="/spots" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-full btn-forward">
            Explore All Spots <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingSpots ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SpotCardSkeleton key={i} />
            ))}
          </div>
        ) : featuredSpots.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-3xl border border-border">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2 text-foreground">No active spots loaded</h3>
            <p className="text-muted-foreground mb-6">List your charging outlet to get started in your city!</p>
            <Link to="/host" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-bold transition-all shadow-md btn-forward">
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
                  amenities={
                    Array.isArray(spot.amenities)
                      ? (spot.amenities as string[]).map((a) => ({ name: a }))
                      : spot.amenities
                  }
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

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ChargePush",
    "url": "https://chargepush.vercel.app",
    "logo": "https://chargepush.vercel.app/logo.png",
    "description": "ChargePush is a distributed EV charging-access network and marketplace connecting EV riders with nearby charging access from home hosts, local charging spots, and charging networks."
  };

  return (
    <div className="overflow-hidden">
      <SEO 
        title="ChargePush — EV Charging Access That Keeps You Moving"
        description="Find EV charging access near you or along your route. Discover charging spots, compare options, plan charging and keep moving with ChargePush."
        schema={[orgSchema, faqSchema]}
      />
      
      {heroSection}
      {trustStrip}
      {brandStorySection}
      {networkSection}
      {riderExperienceSection}
      {routeSection}
      {anxietySection}
      {hostSection}
      {whyChargePushSection}
      {rescueSection}
      {featuredSpotsSection}
      <TestimonialCarousel />

      <section className="py-20 lg:py-28 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">Everything you need to know about charging and hosting on ChargePush.</p>
          </div>
          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border">
            <FAQAccordion />
          </div>
        </div>
      </section>

      <CTABanner variant="dark" />

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
