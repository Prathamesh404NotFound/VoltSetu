import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  BadgeCheck,
  Loader2,
  Route,
  AlertCircle,
  Battery,
} from "lucide-react";
import { calculateDistanceKm, cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SpotCard from "@/components/SpotCard";
import BookingModal from "@/components/BookingModal";
import CTABanner from "@/components/CTABanner";
import DestinationSearch, { type Destination } from "@/components/DestinationSearch";
import spotsMapImg from "@/assets/spots-map.jpg";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import { toast } from "sonner";
import SpotsMap from "@/components/SpotsMap";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import SEO from "@/components/SEO";
import {
  fetchOsrmRoute,
  distanceToRouteKm,
  distanceAlongRouteKm,
  findSuggestedStopId,
  ROUTE_CORRIDOR_KM,
  DESTINATION_FALLBACK_RADIUS_KM,
  type GeoJSONLineString,
} from "@/lib/routeUtils";

const filters = ["All", "Open Now", "Verified", "Under Rs 50", "Top Rated", "Nearest"];

type ViewMode = "list" | "map" | "route";

export default function FindSpots() {
  useScrollReveal();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Route mode state
  const [destination, setDestination] = useState<Destination | null>(null);
  const [rangeRemainingKm, setRangeRemainingKm] = useState<number | null>(null);
  const [rangeSkipped, setRangeSkipped] = useState(true);
  const [routeGeometry, setRouteGeometry] = useState<GeoJSONLineString | null>(null);
  const [routeDistanceMeters, setRouteDistanceMeters] = useState<number | null>(null);
  const [routeFallback, setRouteFallback] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    getAllChargingSpots()
      .then((data) => setSpots(data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load charging spots");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const applyPosition = (pos: { coords: { latitude: number; longitude: number } }) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationLoading(false);
    };

    const handleWebLocation = () => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation not supported");
        setLocationLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        applyPosition,
        (err) => {
          console.error(err);
          setLocationError(err.message);
          setLocationLoading(false);
        }
      );
    };

    const handleNativeLocation = async () => {
      try {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
          throw new Error("Location permission denied");
        }
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        applyPosition(position);
      } catch (err: any) {
        console.error(err);
        setLocationError(err.message || "Native location error");
        setLocationLoading(false);
      }
    };

    if (Capacitor.isNativePlatform()) {
      handleNativeLocation();
    } else {
      handleWebLocation();
    }
  }, []);

  // OSRM route fetch when route mode + destination + user location
  useEffect(() => {
    if (viewMode !== "route" || !destination || !userLocation) {
      setRouteGeometry(null);
      setRouteDistanceMeters(null);
      setRouteFallback(false);
      setRouteLoading(false);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    setRouteFallback(false);

    fetchOsrmRoute(userLocation, destination).then((result) => {
      if (cancelled) return;
      if (result) {
        setRouteGeometry(result.geometry);
        setRouteDistanceMeters(result.distanceMeters);
        setRouteFallback(false);
      } else {
        setRouteGeometry(null);
        setRouteDistanceMeters(null);
        setRouteFallback(true);
      }
      setRouteLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [viewMode, destination, userLocation]);

  function parseTimeRange(range: string): { start: number; end: number } | null {
    const parts = range.split("-").map((p) => p.trim());
    if (parts.length !== 2) return null;
    const toMinutes = (t: string): number => {
      const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return 0;
      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      return hour * 60 + minute;
    };
    return { start: toMinutes(parts[0]), end: toMinutes(parts[1]) };
  }

  function isSpotOpen(availableHours: string | undefined): boolean {
    if (!availableHours) return true;
    const range = parseTimeRange(availableHours);
    if (!range) return true;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (range.start <= range.end) {
      return nowMins >= range.start && nowMins <= range.end;
    }
    return nowMins >= range.start || nowMins <= range.end;
  }

  const spotsWithDistance = spots.map((spot) => {
    let distance: number | null = null;
    if (userLocation && spot.coordinates) {
      distance = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        spot.coordinates.lat,
        spot.coordinates.lng
      );
    }
    return { ...spot, distance };
  });

  const baseFilteredSpots = useMemo(() => {
    let result = spotsWithDistance.filter((spot) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (
          !spot.name?.toLowerCase().includes(query) &&
          !spot.city?.toLowerCase().includes(query) &&
          !spot.address?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (activeFilter === "Open Now") return isSpotOpen(spot.availableHours);
      if (activeFilter === "Verified") return spot.isVerified;
      if (activeFilter === "Under Rs 50") return spot.pricePerHour < 50;
      if (activeFilter === "Top Rated") return spot.rating >= 4.5;
      return true;
    });

    if (activeFilter === "Nearest" && userLocation) {
      result = result
        .filter((s) => s.distance !== null)
        .sort((a, b) => (a.distance as number) - (b.distance as number));
    }

    return result;
  }, [spotsWithDistance, searchQuery, activeFilter, userLocation]);

  const routeFilteredSpots = useMemo(() => {
    if (viewMode !== "route" || !destination) return [];

    const withCoords = baseFilteredSpots.filter((s) => s.coordinates?.lat && s.coordinates?.lng);

    if (routeGeometry && !routeFallback) {
      return withCoords
        .map((spot) => ({
          ...spot,
          routeDistanceKm: distanceToRouteKm(spot.coordinates, routeGeometry),
          routeAlongKm: distanceAlongRouteKm(spot.coordinates, routeGeometry),
        }))
        .filter((s) => s.routeDistanceKm <= ROUTE_CORRIDOR_KM)
        .sort((a, b) => a.routeAlongKm - b.routeAlongKm);
    }

    // Fallback: spots near destination
    return withCoords
      .map((spot) => ({
        ...spot,
        destDistanceKm: calculateDistanceKm(
          destination.lat,
          destination.lng,
          spot.coordinates.lat,
          spot.coordinates.lng
        ),
      }))
      .filter((s) => s.destDistanceKm <= DESTINATION_FALLBACK_RADIUS_KM)
      .sort((a, b) => a.destDistanceKm - b.destDistanceKm);
  }, [viewMode, destination, baseFilteredSpots, routeGeometry, routeFallback]);

  const filteredSpots = viewMode === "route" ? routeFilteredSpots : baseFilteredSpots;

  const routeDistanceKm =
    routeDistanceMeters !== null ? Math.round((routeDistanceMeters / 1000) * 10) / 10 : null;

  const suggestedStopId = useMemo(() => {
    if (
      viewMode !== "route" ||
      !routeGeometry ||
      routeFallback ||
      rangeSkipped ||
      rangeRemainingKm === null ||
      rangeRemainingKm <= 0
    ) {
      return undefined;
    }
    if (!routeDistanceKm || routeDistanceKm <= rangeRemainingKm) return undefined;
    const targetAlong = rangeRemainingKm / 2;
    return findSuggestedStopId(routeFilteredSpots, routeGeometry, targetAlong);
  }, [
    viewMode,
    routeGeometry,
    routeFallback,
    rangeSkipped,
    rangeRemainingKm,
    routeDistanceKm,
    routeFilteredSpots,
  ]);

  const renderSpotCard = (spot: any, i: number) => (
    <div
      key={spot.id || i}
      className="reveal"
      style={{ transitionDelay: `${Math.min(i, 10) * 0.05}s` }}
    >
      <SpotCard
        id={spot.id}
        name={spot.name}
        host={spot.hostName}
        hostPhone={spot.hostPhone}
        distance={
          viewMode === "route" && spot.routeAlongKm !== undefined
            ? `${spot.routeAlongKm.toFixed(1)} km along route`
            : spot.distance
              ? `${spot.distance.toFixed(1)} km`
              : undefined
        }
        pricePerHour={spot.pricePerHour}
        rating={!spot.reviews?.length && !spot.totalCharges ? null : spot.rating}
        reviews={spot.reviews?.length || spot.totalCharges || 0}
        isOpen={isSpotOpen(spot.availableHours)}
        isVerified={spot.isVerified}
        outletType={spot.outletType}
        availableHours={spot.availableHours}
        image={spot.photos?.[0]}
        suggestedStop={spot.id === suggestedStopId}
        onBook={() => setSelectedSpot(spot)}
      />
    </div>
  );

  return (
    <div className="pt-24">
      <SEO
        title={
          selectedSpot
            ? `${selectedSpot.name} - EV Charging Spot in ${selectedSpot.area || selectedSpot.city || "Kolhapur"} | VoltSetu`
            : "Find EV Charging Spots Near You | VoltSetu"
        }
        description={
          selectedSpot
            ? `Book charging at ${selectedSpot.name}. Located in ${selectedSpot.address || selectedSpot.city}. Outlet: ${selectedSpot.outletType || "Standard"}. Charging rate: Rs ${selectedSpot.pricePerHour || 10}/hr. Verified host.`
            : "Search our real-time map for verified EV charging spots in your neighborhood. Check availability, book instantly, and charge your vehicle with ease."
        }
      />

      <section className="relative py-16 gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={spotsMapImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-5xl text-white mb-4">
              Find EV Charging Spots Near You
            </h1>
            <p className="text-white/70 max-w-lg mx-auto">
              Discover verified home charging points in your neighborhood. Search, book, and charge
              in minutes.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by location, area, or landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card text-foreground shadow-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border-0"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 min-h-[50vh]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none flex-1">
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilter === f
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-card border border-border p-1 rounded-full w-fit flex-shrink-0">
              {(
                [
                  { id: "list" as const, label: "List View" },
                  { id: "map" as const, label: "Map View" },
                  { id: "route" as const, label: "On My Way" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                    viewMode === id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {id === "route" && <Route className="w-3 h-3 inline mr-1 -mt-0.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === "route" && (
            <div className="mb-8 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground mb-1">
                    Plan your route
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Find charging spots along your drive using OpenStreetMap search and approximate
                    driving directions (not two-wheeler specific).
                  </p>
                </div>

                <DestinationSearch value={destination} onChange={setDestination} />

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Battery className="w-4 h-4 text-primary" />
                    Estimated range remaining (km)
                    <span className="text-muted-foreground font-normal">— optional</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      disabled={rangeSkipped}
                      value={rangeRemainingKm ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setRangeRemainingKm(Number.isFinite(v) ? v : null);
                        setRangeSkipped(false);
                      }}
                      placeholder="e.g. 25"
                      className="w-32 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setRangeSkipped(true);
                        setRangeRemainingKm(null);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                        rangeSkipped
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Skip
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your own estimate — we don&apos;t read vehicle telemetry.
                  </p>
                </div>
              </div>

              {locationLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Getting your location for route planning…
                </div>
              )}

              {!locationLoading && !userLocation && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {locationError
                      ? `Location unavailable (${locationError}). Enable location access to draw a route from where you are.`
                      : "Enable location access to draw a route from where you are."}
                  </span>
                </div>
              )}

              {!destination && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Enter a destination above to see spots on your way.
                </p>
              )}

              {destination && userLocation && routeLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Calculating route…
                </div>
              )}

              {destination && userLocation && routeFallback && !routeLoading && (
                <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  Couldn&apos;t calculate a route — showing spots near your destination instead.
                </div>
              )}

              {destination &&
                userLocation &&
                !rangeSkipped &&
                rangeRemainingKm !== null &&
                routeDistanceKm !== null &&
                !routeLoading && (
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm border",
                      routeDistanceKm > rangeRemainingKm
                        ? "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100"
                        : "border-green-200 bg-green-50 text-green-900 dark:bg-green-950/30 dark:border-green-800 dark:text-green-100"
                    )}
                  >
                    {routeDistanceKm > rangeRemainingKm ? (
                      <>
                        Your trip is about {routeDistanceKm} km — you may want to charge along the
                        way.
                      </>
                    ) : (
                      <>
                        You should be able to make this trip without charging — but here are spots
                        along the way just in case.
                      </>
                    )}
                  </div>
                )}
            </div>
          )}

          {!loading && (
            <div className="flex items-center gap-6 mb-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {filteredSpots.length} spots found
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-ev-green" />
                {filteredSpots.filter((s) => s.isVerified).length} verified
              </span>
              {viewMode === "route" && routeDistanceKm !== null && !routeFallback && (
                <span className="flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-primary" />
                  ~{routeDistanceKm} km route
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p>Searching for nearby EV spots...</p>
            </div>
          ) : viewMode === "list" ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSpots.map((spot, i) => renderSpotCard(spot, i))}
              </div>
              {filteredSpots.length === 0 && (
                <div className="text-center py-20">
                  <Filter className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                    No spots found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search in a different area.
                  </p>
                </div>
              )}
            </>
          ) : viewMode === "map" ? (
            <div className="reveal">
              <SpotsMap
                spots={filteredSpots}
                onBookSpot={(spot) => setSelectedSpot(spot)}
                userLocationOverride={userLocation}
              />
            </div>
          ) : (
            <div className="space-y-8">
              {destination && userLocation && !routeLoading && (
                <div className="reveal">
                  <SpotsMap
                    spots={filteredSpots}
                    onBookSpot={(spot) => setSelectedSpot(spot)}
                    routeGeometry={routeGeometry}
                    destination={destination}
                    userLocationOverride={userLocation}
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Route shown uses driving directions as an approximation — not exact
                    two-wheeler routing.
                  </p>
                </div>
              )}

              {destination && userLocation && !routeLoading && (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSpots.map((spot, i) => renderSpotCard(spot, i))}
                  </div>
                  {filteredSpots.length === 0 && (
                    <div className="text-center py-12">
                      <Route className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
                      <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                        No spots along this route
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Try a different destination or widen your search — we show spots within{" "}
                        {routeFallback
                          ? `${DESTINATION_FALLBACK_RADIUS_KM} km of your destination`
                          : `${ROUTE_CORRIDOR_KM} km of the route`}
                        .
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <CTABanner
        title="Can't find a spot nearby?"
        subtitle="Register your home outlet and become the charging spot your neighborhood needs."
      />

      {selectedSpot && (
        <BookingModal
          isOpen={!!selectedSpot}
          onClose={() => setSelectedSpot(null)}
          spot={selectedSpot}
        />
      )}
    </div>
  );
}
