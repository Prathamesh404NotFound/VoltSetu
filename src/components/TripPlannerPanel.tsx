/* VoltSetu Trip Planner (Round 13) — rider enters a start point and a
 * destination; the panel geocodes both, fetches a route from OSRM, and lists
 * all VoltSetu spots within a configurable corridor around the route.
 *
 * No map drawing to keep the chunk small: results are a distance-sorted list
 * with ₹/km prices so riders can pick the cheapest stop on their commute.
 */
import { useState } from "react";
import { MapPin, Navigation2, Loader2, BatteryCharging, Crosshair, Clock, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/lib/i18n";
import {
  geocodeAddress,
  findSpotsOnRoute,
  type LatLng,
} from "@/lib/tripPlannerService";
import { pricePerKmRs } from "@/lib/rideCostService";

export type TripSpot = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  pricePerHour?: number;
  city?: string;
  isAvailable?: boolean;
};

interface TripPlannerPanelProps {
  spots: TripSpot[];
  onPickSpot: (spot: TripSpot) => void;
}

export function TripPlannerPanel({ spots, onPickSpot }: TripPlannerPanelProps) {
  const t = useT();
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [myLocLoading, setMyLocLoading] = useState(false);
  const [corridor, setCorridor] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ routeSpots: import("@/lib/tripPlannerService").RouteSpot[]; totalKm: number } | null>(null);

  async function handlePlan() {
    setError(null);
    setResult(null);
    if (!startQuery.trim() || !endQuery.trim()) {
      setError("Please enter both a start point and a destination");
      return;
    }
    setLoading(true);
    try {
      const [start, end] = await Promise.all([
        geocodeAddress(startQuery),
        geocodeAddress(endQuery),
      ]);
      if (!start || !end) {
        setError(
          "Could not find one of the locations. Try a more specific address or place name."
        );
        setLoading(false);
        return;
      }
      // Include only spots that actually carry coordinates for corridor matching.
      const indexed = spots.filter((s) => s.lat != null && s.lng != null);
      if (indexed.length === 0) {
        setError("No charging spots with locations are loaded yet. Please wait and try again.");
        setLoading(false);
        return;
      }
      const res = await findSpotsOnRoute(start as LatLng, end as LatLng, indexed, corridor);
      setResult({
        routeSpots: res.routeSpots,
        totalKm: res.totalKm,
      });
      if (res.routeSpots.length === 0) {
        setError(t("trip.noSpots"));
      }
    } catch {
      setError("Something went wrong planning the route. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    if (myLocLoading) return;
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setMyLocLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      setStartQuery(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
    } catch {
      setError("Location access was denied — type a place name instead (e.g. Kolhapur, Maharashtra).");
    } finally {
      setMyLocLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Navigation2 className="w-4 h-4 text-primary" />
        <h2 className="font-display font-bold text-base">{t("trip.title")}</h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">— {t("trip.subtitle")}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          <input
            value={startQuery}
            onChange={(e) => setStartQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlan()}
            placeholder={t("trip.start") + " (e.g. Kolhapur, Maharashtra)"}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={useMyLocation}
            disabled={myLocLoading}
            title="Use my current location as start"
            aria-label="Use my current location as start"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            {myLocLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
          <input
            value={endQuery}
            onChange={(e) => setEndQuery(e.target.value)}
            placeholder={t("trip.destination") + " (e.g. Sangli)"}
            onKeyDown={(e) => e.key === "Enter" && handlePlan()}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-40">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{t("trip.corridor")}</span>
          <Slider
            value={[corridor]}
            min={1}
            max={10}
            step={1}
            onValueChange={(v) => setCorridor(v[0])}
            className="flex-1"
            aria-label="Corridor radius in kilometers"
          />
          <span className="text-xs font-semibold w-10 text-right">{corridor} km</span>
        </div>
        <Button onClick={handlePlan} disabled={loading} className="gap-2 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation2 className="w-4 h-4" />}
          {t("trip.plan")}
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
      )}

      {result && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">
              {result.routeSpots.length} {t("trip.spotsFound")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("trip.distance")}: <span className="font-semibold text-foreground">{result.totalKm} km</span>
            </p>
          </div>
          <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {result.routeSpots.map((rs) => (
              <li key={rs.spot.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:border-primary/50 transition-colors">
                <MapPinned className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{rs.spot.name}</p>
                    {rs.spot.isAvailable !== false && (
                      <Clock className="w-3 h-3 text-ev-green shrink-0" title="Open now" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rs.spot.city ? `${rs.spot.city} · ` : ""}
                    {rs.distanceFromStartKm} km from start · {rs.minDistanceToRouteKm} km off route
                    {rs.spot.pricePerHour ? ` · ₹${pricePerKmRs(rs.spot.pricePerHour)?.toFixed(2) ?? "—"}/km` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onPickSpot(rs.spot as TripSpot)}
                  className="text-[11px] font-semibold text-primary hover:underline whitespace-nowrap"
                >
                  Book / Request
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

