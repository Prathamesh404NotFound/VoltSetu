import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Filter, SlidersHorizontal, BadgeCheck, Zap, Loader2 } from "lucide-react";
import { calculateDistanceKm } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SpotCard from "@/components/SpotCard";
import BookingModal from "@/components/BookingModal";
import CTABanner from "@/components/CTABanner";
import spotsMapImg from "@/assets/spots-map.jpg";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import { toast } from "sonner";
import SpotsMap from "@/components/SpotsMap";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const filters = ["All", "Open Now", "Verified", "Under Rs 50", "Top Rated", "Nearest"];

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
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    getAllChargingSpots()
      .then((data) => {
        setSpots(data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load charging spots");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Fetch user location on mount
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
        if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
          throw new Error("Location permission denied");
        }
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
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
  // Helper to parse time strings like "8:00 AM - 11:00 PM"
  function parseTimeRange(range: string): { start: number; end: number } | null {
    const parts = range.split("-").map(p => p.trim());
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
    const start = toMinutes(parts[0]);
    const end = toMinutes(parts[1]);
    return { start, end };
  }

  function isSpotOpen(availableHours: string | undefined): boolean {
    if (!availableHours) return true; // assume always open if not specified
    const range = parseTimeRange(availableHours);
    if (!range) return true;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (range.start <= range.end) {
      return nowMins >= range.start && nowMins <= range.end;
    } else {
      // overnight range
      return nowMins >= range.start || nowMins <= range.end;
    }
  }

  // Compute spots with distance if user location is available
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

  // Apply filters and sorting
  const filteredSpots = useMemo(() => {
    let result = spotsWithDistance.filter((spot) => {
      // text search
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

      // categorization filters
      if (activeFilter === "Open Now") return isSpotOpen(spot.availableHours);
      if (activeFilter === "Verified") return spot.isVerified;
      if (activeFilter === "Under Rs 50") return spot.pricePerHour < 50;
      if (activeFilter === "Top Rated") return spot.rating >= 4.5;
      // "Nearest" filter will be handled by sorting below
      return true;
    });

    if (activeFilter === "Nearest" && userLocation) {
      result = result
        .filter((s) => s.distance !== null)
        .sort((a, b) => (a.distance as number) - (b.distance as number));
    }

    return result;
  }, [spotsWithDistance, searchQuery, activeFilter, userLocation]);

  return (
    <div className="pt-24">
      {/* Hero */}
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
              Discover verified home charging points in your neighborhood. Search, book, and charge in minutes.
            </p>
          </div>

          {/* Search */}
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

      {/* Filters & Results */}
      <section className="py-12 min-h-[50vh]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            {/* Filters */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none flex-1">
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === f
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-card border border-border p-1 rounded-full w-fit flex-shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Map View
              </button>
            </div>
          </div>

          {!loading && (
            <div className="flex items-center gap-6 mb-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {filteredSpots.length} spots found
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-ev-green" />
                {filteredSpots.filter(s => s.isVerified).length} verified
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p>Searching for nearby EV spots...</p>
            </div>
          ) : (
            <>
              {viewMode === "list" ? (
                <>
                  {/* Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSpots.map((spot, i) => (
                      <div key={spot.id || i} className="reveal" style={{ transitionDelay: `${Math.min(i, 10) * 0.05}s` }}>
                        <SpotCard
                          id={spot.id}
                          name={spot.name}
                          host={spot.hostName}
                          hostPhone={spot.hostPhone}
                          distance={spot.distance ? `${spot.distance.toFixed(1)} km` : undefined}
                          pricePerHour={spot.pricePerHour}
                          rating={(!spot.reviews?.length && !spot.totalCharges) ? null : spot.rating}
                          reviews={spot.reviews?.length || spot.totalCharges || 0}
                          isOpen={isSpotOpen(spot.availableHours)}
                          isVerified={spot.isVerified}
                          outletType={spot.outletType}
                          availableHours={spot.availableHours}
                          image={spot.photos?.[0]}
                          onBook={() => setSelectedSpot(spot)}
                        />
                      </div>
                    ))}
                  </div>

                  {filteredSpots.length === 0 && (
                    <div className="text-center py-20">
                      <Filter className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
                      <h3 className="font-display font-semibold text-xl text-foreground mb-2">No spots found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters or search in a different area.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="reveal">
                  <SpotsMap spots={filteredSpots} onBookSpot={(spot) => setSelectedSpot(spot)} />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CTABanner title="Can't find a spot nearby?" subtitle="Register your home outlet and become the charging spot your neighborhood needs." />

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
