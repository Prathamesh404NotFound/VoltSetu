import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  ChevronDown,
} from "lucide-react";
import { calculateDistanceKm, cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SpotCard from "@/components/SpotCard";
import BookingModal from "@/components/BookingModal";
import CTABanner from "@/components/CTABanner";
import DestinationSearch, { type Destination } from "@/components/DestinationSearch";
import { TripPlannerPanel } from "@/components/TripPlannerPanel";
import spotsMapImg from "@/assets/spots-map.jpg";
import SpotsMap from "@/components/SpotsMap";
import CitySelector from "@/components/CitySelector";
import SEO from "@/components/SEO";
import { getCurrentLocation, getAccuracyLabel, type UserLocationResult } from "@/lib/locationService";
import { fetchRoute, type RouteResult } from "@/lib/routingService";
import {
  distanceToRouteKm,
  distanceAlongRouteKm,
  findSuggestedStopId,
  ROUTE_CORRIDOR_KM,
  DESTINATION_FALLBACK_RADIUS_KM,
  type GeoJSONLineString,
} from "@/lib/routeUtils";
import { toast } from "sonner";
import { useSpots } from "@/hooks/useSpots";
import SpotCardSkeleton from "@/components/SpotCardSkeleton.tsx";

const PAGE_SIZE = 12;

type ViewMode = "list" | "map" | "route";

export default function FindSpots() {
  useScrollReveal();
  const [activeFilter, setActiveFilter] = useState("All");
  // Raw search input (unthrottled — for the controlled input)
  const [searchInputValue, setSearchInputValue] = useState("");
  // Debounced value used for filtering (updated 300ms after typing stops)
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationResult | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);

  // Route mode state
  const [destination, setDestination] = useState<Destination | null>(null);
  const [rangeRemainingKm, setRangeRemainingKm] = useState<number | null>(null);
  const [rangeSkipped, setRangeSkipped] = useState(true);
  const [routeGeometry, setRouteGeometry] = useState<GeoJSONLineString | null>(null);
  const [routeDistanceMeters, setRouteDistanceMeters] = useState<number | null>(null);
  const [routeFallback, setRouteFallback] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // ─── React Query: cached spot list (N+1 fix + cross-page caching) ───────────
  const { data: spots = [], isLoading: loading } = useSpots();

  // ─── Location ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loc = await getCurrentLocation({ timeoutMs: 8000 });
        if (!cancelled) {
          setUserLocation(loc);
          setLocationLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setLocationError(err.message || "Location unavailable");
          setLocationLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Debounce search input (300 ms) ─────────────────────────────────────────
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val);
      setPage(1); // Reset pagination on new search
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [activeFilter, viewMode]);

  // ─── Route fetch ─────────────────────────────────────────────────────────────
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

    fetchRoute(userLocation, destination)
      .then((result: RouteResult) => {
        if (cancelled) return;
        setRouteGeometry(result.geometry);
        setRouteDistanceMeters(Math.round(result.distanceKm * 1000));
        setRouteFallback(result.isFallback);
        setRouteLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRouteGeometry(null);
        setRouteDistanceMeters(null);
        setRouteFallback(true);
        setRouteLoading(false);
      });

    return () => { cancelled = true; };
  }, [viewMode, destination, userLocation]);

  // ─── Pure helper functions (stable references, no deps change) ───────────────
  const parseTimeRange = useCallback((range: string): { start: number; end: number } | null => {
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
  }, []);

  const isSpotOpen = useCallback((availableHours: string | undefined): boolean => {
    if (!availableHours) return true;
    const range = parseTimeRange(availableHours);
    if (!range) return true;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (range.start <= range.end) {
      return nowMins >= range.start && nowMins <= range.end;
    }
    return nowMins >= range.start || nowMins <= range.end;
  }, [parseTimeRange]);

  // ─── spotsWithDistance — memoized, only recalculates when spots or location change ──
  const spotsWithDistance = useMemo(() => {
    return spots.map((spot) => {
      let distance: number | null = null;
      if (userLocation && spot.coordinates) {
        distance = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          spot.coordinates.lat,
          spot.coordinates.lng
        );
      }
      return { ...spot, distance, lat: spot.coordinates?.lat, lng: spot.coordinates?.lng };
    });
  }, [spots, userLocation]);

  // ─── Filter counts — separated from filtering so they're stable ──────────────
  const filterCounts = useMemo(() => ({
    All: spotsWithDistance.length,
    Verified: spotsWithDistance.filter((s) => s.isVerified).length,
    "Under Rs 50": spotsWithDistance.filter((s) => (s.pricePerHour ?? 0) < 50).length,
    "Top Rated": spotsWithDistance.filter((s) => (s.rating ?? 0) >= 4.5).length,
    Nearest: spotsWithDistance.filter((s) => s.distance !== null).length,
  }), [spotsWithDistance]);

  // ─── Base filter (search + active filter tab) ─────────────────────────────────
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
      if (activeFilter === "Under Rs 50") return (spot.pricePerHour ?? 0) < 50;
      if (activeFilter === "Top Rated") return (spot.rating ?? 0) >= 4.5;
      return true;
    });

    if (activeFilter === "Nearest" && userLocation) {
      result = result
        .filter((s) => s.distance !== null)
        .sort((a, b) => (a.distance as number) - (b.distance as number));
    }

    return result;
  }, [spotsWithDistance, searchQuery, activeFilter, userLocation, isSpotOpen]);

  // ─── Route filter ─────────────────────────────────────────────────────────────
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
          spot.coordinates!.lat,
          spot.coordinates!.lng
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

  // ─── Pagination ───────────────────────────────────────────────────────────────
  const paginatedSpots = useMemo(
    () => filteredSpots.slice(0, page * PAGE_SIZE),
    [filteredSpots, page]
  );
  const hasMore = paginatedSpots.length < filteredSpots.length;

  const renderSpotCard = useCallback((spot: any, i: number) => (
    <div
      key={spot.id || i}
      className="reveal"
      style={{ transitionDelay: `${Math.min(i, 10) * 0.05}s` }}
    >
      <SpotCard
        id={spot.id}
        name={spot.name}
        host={spot.hostName}
        hostId={spot.hostId}
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
        isPaused={spot.isPaused}
        isVerified={spot.isVerified}
        isNetworkStation={spot.isNetworkStation}
        outletType={spot.outletType}
        availableHours={spot.availableHours}
        amenities={spot.amenities}
        image={spot.photos?.[0]}
        suggestedStop={spot.id === suggestedStopId}
        onBook={() => setSelectedSpot(spot)}
      />
    </div>
  ), [viewMode, suggestedStopId, isSpotOpen]);

  return (
    <div className="pt-24 bg-[#F4F6F9] min-h-screen">
      <SEO
        title={
          selectedSpot
            ? `${selectedSpot.name} — ChargePush EV Charging Access`
            : "Find a Charge Near You | ChargePush"
        }
        description={
          selectedSpot
            ? `Book charging at ${selectedSpot.name}. Located in ${selectedSpot.address || selectedSpot.city}. Rate: Rs ${selectedSpot.pricePerHour || 10}/hr. ChargePush host.`
            : "Find nearby charging access on the ChargePush Network. Compare rates, check availability, reserve charging access, and keep moving."
        }
      />

      <section className="relative py-16 gradient-hero overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-20">
          <img
            src={spotsMapImg}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-display font-black text-3xl md:text-5xl text-white mb-4">
              Find a charge nearby.
            </h1>
            <p className="text-white/80 max-w-lg mx-auto font-medium text-base">
              Discover charging access around you, compare your options and keep moving.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search area, landmark or destination..."
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-foreground shadow-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border-0 font-medium"
                />
              </div>
              <CitySelector variant="hero" className="shrink-0 h-[52px]" />
            </div>

            {/* Location UX Status Banner */}
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-white/90 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 w-fit mx-auto">
              {locationLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Detecting your location…</span>
                </>
              ) : userLocation ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{getAccuracyLabel(userLocation.accuracyTier, userLocation.accuracy)}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Location unavailable — showing all active network spots</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sunken Filter Control Bar */}
      <section className="py-6 bg-[#EAF0F6] border-b border-slate-200/80">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {(
                [
                  "All",
                  "Verified",
                  "Under Rs 50",
                  "Top Rated",
                  "Nearest",
                ] as const
              ).map((f) => {
                const count = filterCounts[f] ?? null;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    aria-pressed={activeFilter === f}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      activeFilter === f
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100/80 shadow-2xs"
                    }`}
                  >
                    {f}
                    {count !== null && (
                      <span className={`ml-1.5 text-[11px] font-bold ${activeFilter === f ? "text-primary-foreground/80" : "text-slate-500"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <CitySelector variant="filter" />
              <div className="flex items-center bg-slate-200/70 border border-slate-300/60 p-1 rounded-full w-fit shadow-inner-xs">
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
                      "px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      viewMode === id
                        ? "bg-white text-primary shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-foreground"
                    )}
                  >
                    {id === "route" && <Route className="w-3 h-3 inline mr-1 -mt-0.5" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 min-h-[50vh]">
        <div className="container mx-auto px-4">
          {viewMode === "route" && (
            <div className="mb-8 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground mb-1">
                    Plan your route
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Find charging spots along your drive using OpenStreetMap search and driving directions.
                  </p>
                </div>

                <DestinationSearch value={destination} onChange={setDestination} />
                <TripPlannerPanel
                  spots={spotsWithDistance.map((s) => ({
                    ...s,
                    // TripSpot requires name: string; EnrichedSpot has name?: string.
                    // Spots always have a name in practice — fall back to empty string
                    // so the type contract is satisfied without a runtime error.
                    name: s.name ?? "",
                  }))}
                  onPickSpot={(tripSpot) => {
                    const match = spotsWithDistance.find((s) => s.id === tripSpot.id);
                    setSelectedSpot(match ?? tripSpot);
                    setViewMode("list");
                  }}
                />

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
                </div>
              </div>

              {!userLocation && (
                <div className="flex flex-col gap-3 rounded-xl border border-[#D97706]/30 bg-[#FEF3C7] px-4 py-3 text-sm text-[#92400E]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {locationError
                        ? `Location unavailable (${locationError}). Enter coordinates to set start location.`
                        : "Enable location access to draw a route from where you are."}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const lat = parseFloat(manualLat);
                        const lng = parseFloat(manualLng);
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                          toast.error("Please enter valid coordinates, e.g. 16.7050, 74.2433");
                          return;
                        }
                        setUserLocation({
                          lat,
                          lng,
                          accuracy: 100,
                          accuracyTier: "approximate",
                          timestamp: Date.now(),
                          source: "manual",
                        });
                        setLocationError(null);
                        toast.success("Starting point set");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#FEF3C7] px-3 py-1.5 font-medium text-[#92400E] hover:bg-[#FDE68A] transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Set starting point by coordinates
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Latitude"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      className="w-32 rounded-lg border border-[#D97706]/40 bg-white px-2.5 py-1.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Longitude"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      className="w-32 rounded-lg border border-[#D97706]/40 bg-white px-2.5 py-1.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
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
                  Showing approximate straight-line route to destination.
                </div>
              )}
            </div>
          )}

          {!loading && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{filteredSpots.length}</span> spots found
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-ev-green" />
                {filteredSpots.filter((s) => s.isVerified).length} verified
              </span>
              <span className="flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-ev-green" />
                {filteredSpots.filter((s) => isSpotOpen(s.availableHours)).length} open now
              </span>
              {viewMode === "route" && routeDistanceKm !== null && (
                <span className="flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-primary" />
                  ~{routeDistanceKm} km route
                </span>
              )}
            </div>
          )}

          {loading ? (
            /* ── Skeleton grid (12 cards) replaces the old spinner ── */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SpotCardSkeleton key={i} />
              ))}
            </div>
          ) : viewMode === "list" ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedSpots.map((spot, i) => renderSpotCard(spot, i))}
              </div>

              {/* Load More button */}
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-primary/30 bg-white text-primary font-semibold text-sm hover:bg-primary/5 transition-all shadow-sm"
                  >
                    Load more spots
                    <ChevronDown className="w-4 h-4" />
                    <span className="text-muted-foreground font-normal">
                      ({filteredSpots.length - paginatedSpots.length} remaining)
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full min-h-[400px]">
              <SpotsMap
                spots={filteredSpots}
                onBookSpot={(spot) => setSelectedSpot(spot)}
                routeGeometry={routeGeometry}
                destination={destination}
                userLocationOverride={userLocation}
              />
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
