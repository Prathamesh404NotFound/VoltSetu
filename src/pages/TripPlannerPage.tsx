/**
 * VoltSetu Trip Planner (Round 32) — dedicated standalone page.
 *
 * Riders enter a start point and destination; the planner geocodes both via
 * Nominatim (OpenStreetMap), pulls a driving route from OSRM, and lists every
 * VoltSetu spot (host + network stations) within the corridor, ranked by
 * distance from the start with ₹/km pricing so riders pick the cheapest
 * stop on the way. Entry points: navbar "Trip Planner" link and the
 * "On My Way" toggle on Find Spots.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Route, Navigation2, Loader2, AlertCircle, Zap, MapPinned, BatteryCharging, IndianRupee, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import CTABanner from "@/components/CTABanner";
import ResponsiveContainer from "@/components/ui/responsive-container";
import { Button } from "@/components/ui/button";
import { TripPlannerPanel, type TripSpot } from "@/components/TripPlannerPanel";
import { useT } from "@/lib/i18n";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import { getAllNetworkStations, mergeNetworkStations } from "@/lib/networkStationsService";
import { toast } from "sonner";

export default function TripPlannerPage() {
  const t = useT();
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([getAllChargingSpots(), getAllNetworkStations()])
      .then(([data, net]) =>
        setSpots(
          mergeNetworkStations(data, net).map((s: any) => ({
            ...s,
            lat: s.coordinates?.lat,
            lng: s.coordinates?.lng,
            isAvailable: s.availableHours === undefined,
          })),
        ),
      )
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load charging spots");
      })
      .finally(() => setLoading(false));
  }, []);

  const tripSpots: TripSpot[] = useMemo(
    () =>
      spots.map((s) => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        pricePerHour: s.pricePerHour,
        city: s.city,
        isAvailable: s.isAvailable,
      })),
    [spots],
  );

  if (selectedSpot) {
    return (
      <div className="pt-24 pb-16">
        <SEO title={`${selectedSpot.name} — ChargePush Route`} description={`Charging stop on your route: ${selectedSpot.name}.`} />
        <ResponsiveContainer size="xl" className="py-6">
          <Link to="/route" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 font-semibold">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to ChargePush Route
          </Link>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h1 className="font-display font-bold text-xl text-foreground mb-1">{selectedSpot.name}</h1>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedSpot.city ?? "India"} · ₹{(selectedSpot.pricePerHour ?? 10)}/hr
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setSelectedSpot(null)} variant="outline" size="sm" className="font-semibold">
                Keep planning
              </Button>
              <Button asChild size="sm" className="font-semibold btn-forward">
                <Link to="/spots">Browse all charging access</Link>
              </Button>
            </div>
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <SEO
        title="ChargePush Route — Plan Your Charge Along Your Journey"
        description="Enter your starting point and destination. ChargePush Route surfaces every verified charging access point along your drive so you can charge and keep moving."
      />

      <section className="relative py-16 gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <img src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1600&q=60" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-bold text-white mb-4">
              <Route className="w-3.5 h-3.5" /> ChargePush Route
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl text-white mb-4">
              Plan Your Charge
            </h1>
            <p className="text-white/70 max-w-xl mx-auto font-medium">
              Enter your route and ChargePush will surface every charging access point along your journey. Charge. Push. Go.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 min-h-[40vh]">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-20 font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading ChargePush Network…
            </div>
          ) : (
            <TripPlannerPanel spots={tripSpots} onPickSpot={setSelectedSpot} />
          )}

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            <div className="rounded-2xl border border-border bg-card p-5">
              <Navigation2 className="w-5 h-5 text-primary mb-2" />
              <p className="font-bold text-sm text-foreground mb-1">Route Corridor Matching</p>
              <p className="text-xs text-muted-foreground font-medium">
                Charging spots matched against driving corridors so every result is on your way.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <IndianRupee className="w-5 h-5 text-primary mb-2" />
              <p className="font-bold text-sm text-foreground mb-1">Transparent Pricing</p>
              <p className="text-xs text-muted-foreground font-medium">
                Upfront rates shown per session and distance so you pick the best stop.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <MapPinned className="w-5 h-5 text-primary mb-2" />
              <p className="font-bold text-sm text-foreground mb-1">Unified Network</p>
              <p className="text-xs text-muted-foreground font-medium">
                Home hosts and charging spots integrated into one unified route planner.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <CTABanner
              variant="dark"
              title="Charge. Push. Go."
              subtitle="ChargePush Route keeps every EV journey moving with accessible charging spots along the way."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
