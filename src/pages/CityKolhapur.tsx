import { MapPin, Zap, BadgeCheck, IndianRupee, Clock, ArrowRight, Phone, MessageCircle, Star, Car, Bike, BatteryCharging, Home, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import CTABanner from "@/components/CTABanner";
import FAQAccordion from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import { getAllNetworkStations, mergeNetworkStations } from "@/lib/networkStationsService";import { useEffect, useState } from "react";

const kolhapurFaqs = [
  { q: "Where can I find EV charging spots in Kolhapur?", a: "ChargePush connects verified host charging access points across Kolhapur — from Shahupuri and Rajarampuri to the Railway Station area and Shirol Road. Use the map on our spots page to find the nearest open location." },
  { q: "How much does EV charging cost in Kolhapur?", a: "Most ChargePush hosts in Kolhapur set clear rates per session or duration. The price is always shown up front before you book." },
  { q: "Is ChargePush available in other cities?", a: "Kolhapur is one of our key locations. We are expanding across Maharashtra and all major Indian cities — hosts from any city can power their neighborhood today." },
  { q: "Can I charge my EV bike overnight in Kolhapur?", a: "Many hosts offer extended evening hours. Filter by 'Open Now' on the spots page or message a host to arrange a convenient time." },
  { q: "How do I earn money listing my outlet in Kolhapur?", a: "Register on the Become a Host page, set your price and hours, get verified, and riders in your neighborhood can book your outlet. Hosts keep their earnings with direct payouts." },
];

const areaCards = [
  { icon: Landmark, name: "Shahupuri & Central Kolhapur", note: "Dense rider demand near markets and offices" },
  { icon: Home, name: "Rajarampuri & Tarabai Park", note: "Residential outlets ideal for overnight charges" },
  { icon: Landmark, name: "Railway Station & Bus Stand", note: "High footfall for quick top-up sessions" },
  { icon: MapPin, name: "Shirol Road & Ichalkaranji corridor", note: "Commuter hotspot with growing EV adoption" },
];

export default function CityKolhapur() {
  useScrollReveal();
  const [spotCount, setSpotCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getAllChargingSpots(), getAllNetworkStations()])
      .then(([spots, net]) => setSpotCount(mergeNetworkStations(spots, net).length))
      .catch(() => setSpotCount(null));
  }, []);

  return (
    <div className="pt-24">
      <SEO
        title="EV Charging in Kolhapur — Verified Host Charging Spots | ChargePush"
        description="Find verified EV charging access points in Kolhapur — Shahupuri, Rajarampuri, Railway Station area and more. Book instantly or list your outlet to power your neighborhood."
        canonical="/kolhapur"
        schema={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "EV Charging Access Points in Kolhapur",
          itemListElement: areaCards.map((a, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: a.name,
          })),
        }}
      />

      {/* Hero */}
      <section className="relative py-20 gradient-hero overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-primary text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" /> Featured Area — Kolhapur, Maharashtra
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight mb-6">
              EV Charging Access in{" "}
              <span className="text-gradient">Kolhapur</span>
            </h1>
            <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
              Book a verified host charging spot near you. Find power, charge, and keep moving anywhere in the city.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild className="px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-lg shadow-xl hover:opacity-90 transition-all btn-forward">
                <Link to="/spots">
                  <Zap className="w-5 h-5" /> Find a Charge
                </Link>
              </Button>
              <Button variant="outline" asChild className="px-8 py-4 rounded-xl bg-white/5 border-white/20 text-white font-semibold text-lg hover:bg-white/15 transition-all btn-forward">
                <Link to="/host">
                  <IndianRupee className="w-5 h-5" /> Power Your Neighborhood
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live count strip */}
      <section className="py-6 bg-soft-gray">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{spotCount ?? "—"}</span> charging spots listed
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-500" /> Verified hosts
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Live availability
            </span>
          </div>
        </div>
      </section>

      {/* Where to charge */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Charge Anywhere in Kolhapur
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              ChargePush hosts cover every major neighborhood — pick the area closest to you.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {areaCards.map((a, i) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.name}
                  className="reveal p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">{a.name}</h3>
                  <p className="text-sm text-muted-foreground">{a.note}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Button asChild className="gradient-primary px-6 py-3 rounded-xl btn-forward">
              <Link to="/spots">
                <MapPin className="w-4 h-4" /> See All Spots on the Map <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For riders & hosts */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="reveal rounded-2xl bg-card border border-border p-8 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5">
                <Bike className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground mb-3">Riding an EV in Kolhapur?</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Skip the long search for charging. Book a verified host outlet near you, check live availability, and keep moving.
              </p>
              <Button asChild className="gradient-primary btn-forward">
                <Link to="/spots">Find a Charge</Link>
              </Button>
            </div>
            <div className="reveal rounded-2xl bg-card border border-border p-8 shadow-sm hover:shadow-xl transition-all duration-300" style={{ transitionDelay: "0.1s" }}>
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5">
                <BatteryCharging className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground mb-3">Have a spare outlet?</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                EV riders in Kolhapur are looking for convenient charging access. List your host outlet, control availability, and earn from usage.
              </p>
              <Button asChild className="gradient-primary btn-forward">
                <Link to="/host">Power Your Neighborhood</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Local proof */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Why Riders Choose ChargePush
            </h2>
          </div>
          <div className="space-y-6">
            {[
              { icon: Star, title: "Verified hosts", desc: "Every host is verified before listing goes live." },
              { icon: Clock, title: "Live open/closed status", desc: "See which spots are open right now before you ride out." },
              { icon: IndianRupee, title: "Transparent pricing", desc: "Pay exactly the listed rate — no hidden fees." },
              { icon: Phone, title: "Direct host contact", desc: "Call or message your host directly from the spot card." },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="reveal flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Kolhapur Charging FAQ
            </h2>
          </div>
          <div className="reveal">
            <FAQAccordion faqs={kolhapurFaqs} />
          </div>
        </div>
      </section>

      <CTABanner
        variant="dark"
        title="Charging in Kolhapur, Made Simple"
        subtitle="Join riders and hosts using ChargePush across the city."
      />

      {/* Local business schema footer note */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "ChargePush EV Charging — Kolhapur",
            areaServed: { "@type": "City", name: "Kolhapur", address: { "@type": "PostalAddress", addressRegion: "Maharashtra", addressCountry: "IN" } },
            provider: { "@type": "Organization", name: "ChargePush", url: "https://chargepush.com" },
            serviceType: "EV Charging Access Network",
            termsOfService: "https://chargepush.com/pricing",
          }),
        }}
      />
    </div>
  );
}
