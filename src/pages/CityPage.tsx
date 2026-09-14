import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Zap, BadgeCheck, Clock, ArrowRight, IndianRupee, Bike, BatteryCharging, Rocket, Flame } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import CTABanner from "@/components/CTABanner";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import NotFound from "@/pages/NotFound";
import CityWaitlist from "@/components/CityWaitlist";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import { getAllNetworkStations, mergeNetworkStations } from "@/lib/networkStationsService";import { getCityBySlug, filterSpotsByCity, CITIES } from "@/lib/cities";

export default function CityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  useScrollReveal();
  const city = getCityBySlug(slug ?? "");
  const [spotCount, setSpotCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city || !city.active) return; // coming-soon cities render without a spot count
    let cancelled = false;
    setLoading(true);
    Promise.all([getAllChargingSpots(), getAllNetworkStations()])
      .then(([spots, net]) => {
        if (cancelled) return;
        const merged = mergeNetworkStations(spots, net);
        setSpotCount(filterSpotsByCity(merged, city.slug).length);
      })
      .catch(() => {
        if (!cancelled) setSpotCount(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  if (!city) {
    return (
      <div className="pt-24 min-h-screen">
        <SEO
          title="City Not Available Yet — ChargePush"
          description="This city is coming soon to ChargePush. Explore our active cities and get notified when we arrive."
          noindex
        />
        <NotFound />
      </div>
    );
  }

  const title = `EV Charging in ${city.name} — Verified Host Spots | ChargePush`;
  const description = `Find verified EV charging access points in ${city.name}, ${city.state}. Book instantly or power your neighborhood as a host.`;

  const otherCities = CITIES.filter((c) => c.active && c.slug !== city.slug);

  // Cities not yet live get a full launch page instead of a 404.
  if (!city.active) {
    const launchTitle = `EV Charging in ${city.name} — Coming Soon | ChargePush`;
    const launchDescription = `ChargePush is launching in ${city.name}, ${city.state}. Join the waitlist as an early rider or become a launch host.`;
    return (
      <div className="pt-24">
        <SEO title={launchTitle} description={launchDescription} canonical={`/city/${city.slug}`} noindex={city.slug !== "kolhapur"} />
        <section className="relative py-20 bg-slate-900 overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-primary text-sm font-medium mb-6">
                <Rocket className="w-4 h-4" /> Coming soon to {city.name}, {city.state}
              </div>
              <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight mb-6">
                ChargePush is on its way to{" "}
                <span className="text-gradient">{city.name}</span>
              </h1>
              <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
                {city.seo?.sub}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-lg shadow-xl hover:opacity-90 transition-all btn-forward">
                  <Link to="/host">
                    <Flame className="w-5 h-5" /> Become a Launch Host
                  </Link>
                </Button>
                <Button variant="outline" asChild className="px-8 py-4 rounded-xl bg-white/5 border-white/20 text-white font-semibold text-lg hover:bg-white/15 transition-all btn-forward">
                  <Link to="/spots">
                    <MapPin className="w-4 h-4" /> Explore Live Cities
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-soft-gray">
          <div className="container mx-auto px-4 max-w-4xl space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-card border border-border p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5">
                  <BatteryCharging className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">Be a launch host in {city.name}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  First hosts get priority verification and featured placement on the {city.name} network page before the city officially opens.
                </p>
                <Button asChild className="gradient-primary btn-forward">
                  <Link to={`/host?city=${city.slug}`}>Power Your Neighborhood First</Link>
                </Button>
              </div>
              <div className="rounded-2xl bg-card border border-border p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5">
                  <Bike className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">Early riders get first dibs</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Join the waitlist and we'll notify you the moment verified spots go live in {city.name}.
                </p>
              </div>
            </div>
            <CityWaitlist slug={city.slug} cityName={city.name} />
          </div>
        </section>

        {otherCities.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-8 text-center">
                ChargePush in Other Cities
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {otherCities.map((c) => (
                  <Button
                    key={c.slug}
                    variant="outline"
                    onClick={() => navigate(`/city/${c.slug}`)}
                    className="rounded-full px-5 py-2.5 hover:-translate-y-0.5 transition-transform"
                  >
                    <MapPin className="w-4 h-4 mr-1.5 text-primary" /> {c.name}
                    <span className="ml-2 text-xs text-muted-foreground">({c.state})</span>
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="pt-24">
      <SEO title={title} description={description} canonical={`/city/${city.slug}`} />

      {/* Hero */}
      <section className="relative py-20 gradient-hero overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-primary text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" /> {city.name}, {city.state}
              {city.launch && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-xs font-semibold">Featured City</span>
              )}
              {!city.active && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/80 text-xs font-semibold">Coming Soon</span>
              )}
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight mb-6">
              EV Charging Access in{" "}
              <span className="text-gradient">{city.name}</span>
            </h1>
            <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
              {city.seo?.sub ??
                "Book a verified host charging spot near you. Find power, charge, and keep moving anywhere in the city."}
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
              <span className="font-semibold text-foreground">{loading ? "…" : (spotCount ?? "—")}</span> charging spots listed
            </span>
            {!loading && spotCount === 0 && (
              <span className="text-xs text-muted-foreground">
                Be the first host in {city.name} — get featured when the network opens
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-500" /> Verified hosts
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Live availability
            </span>
          </div>
        </div>
      </section>

      {/* Riders and hosts */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="reveal rounded-2xl bg-card border border-border p-8 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5">
                <Bike className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground mb-3">Riding an EV in {city.name}?</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                {city.seo?.why ??
                  "Skip the long search for charging. Book a verified host outlet near you, check live availability, and keep moving."}
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
                EV riders in {city.name} are looking for convenient charging access. List your host outlet, control availability, and earn from usage.
              </p>
              <Button asChild className="gradient-primary btn-forward">
                <Link to="/host">Power Your Neighborhood</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Other cities */}
      {otherCities.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-8 text-center reveal">
              ChargePush in Other Cities
            </h2>
            <div className="flex flex-wrap justify-center gap-3 reveal">
              {otherCities.map((c) => (
                <Button
                  key={c.slug}
                  variant="outline"
                  onClick={() => navigate(`/city/${c.slug}`)}
                  className="rounded-full px-5 py-2.5 hover:-translate-y-0.5 transition-transform"
                >
                  <MapPin className="w-4 h-4 mr-1.5 text-primary" /> {c.name}
                  <span className="ml-2 text-xs text-muted-foreground">({c.state})</span>
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABanner
        variant="dark"
        title={`Charging in ${city.name}, Made Simple`}
        subtitle="ChargePush is growing across India — join riders and hosts building the charging network."
      />
      <Button asChild className="fixed bottom-20 right-4 z-40 rounded-full shadow-xl gradient-primary px-5 py-3 text-sm font-semibold hover:-translate-y-0.5 transition-transform">
        <Link to="/spots">
          <MapPin className="w-4 h-4 mr-1" /> Spots in {city.name} <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
