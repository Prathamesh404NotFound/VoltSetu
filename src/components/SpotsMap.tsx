import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BadgeCheck, Loader2 } from "lucide-react";

// ──────────────────────────────────────────
// Helper: re-centre the map when centre/zoom changes.
// Must be rendered INSIDE <MapContainer>.
// ──────────────────────────────────────────
function ChangeMapView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// ──────────────────────────────────────────
// Custom markers via L.divIcon
// ──────────────────────────────────────────
const spotMarkerIcon = L.divIcon({
  className: "custom-spot-marker",
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 30 38" fill="none"
         style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,.15));">
      <path d="M15 0C6.71 0 0 6.71 0 15C0 26.25 15 38 15 38C15 38 30 26.25 30 15C30 6.71 23.29 0 15 0Z
               M15 20.5C11.96 20.5 9.5 18.04 9.5 15C9.5 11.96 11.96 9.5 15 9.5C18.04 9.5 20.5 11.96 20.5 15C20.5 18.04 18.04 20.5 15 20.5Z"
            fill="hsl(217,91%,60%)" stroke="white" stroke-width="2"/>
    </svg>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
});

const userMarkerIcon = L.divIcon({
  className: "custom-user-marker",
  html: `
    <div style="position:relative;width:28px;height:28px;">
      <style>
        @keyframes marker-pulse{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2.4);opacity:0}}
      </style>
      <div style="position:absolute;width:28px;height:28px;background:hsl(142,71%,45%);border-radius:50%;
                  opacity:.4;animation:marker-pulse 1.8s infinite ease-out;"></div>
      <div style="position:absolute;top:6px;left:6px;width:16px;height:16px;
                  background:hsl(142,71%,45%);border:2px solid white;border-radius:50%;
                  box-shadow:0 2px 5px rgba(0,0,0,.3);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// ──────────────────────────────────────────
// Main component
// ──────────────────────────────────────────
interface SpotsMapProps {
  spots: any[];
  onBookSpot: (spot: any) => void;
}

export default function SpotsMap({ spots, onBookSpot }: SpotsMapProps) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  // Keep a ref to the Leaflet map instance (optional, for future imperative use)
  const mapRef = useRef<LeafletMap | null>(null);

  // ── Geolocation ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        console.error("Map geolocation error:", err);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ── Map centre / zoom ──
  const getMapConfig = (): { center: [number, number]; zoom: number } => {
    if (userLocation) {
      return { center: [userLocation.lat, userLocation.lng], zoom: 14 };
    }
    const valid = spots.filter((s) => s.coordinates?.lat && s.coordinates?.lng);
    if (valid.length > 0) {
      const sumLat = valid.reduce((a, s) => a + s.coordinates.lat, 0);
      const sumLng = valid.reduce((a, s) => a + s.coordinates.lng, 0);
      return { center: [sumLat / valid.length, sumLng / valid.length], zoom: 12 };
    }
    return { center: [20.5937, 78.9629], zoom: 5 }; // India centroid fallback
  };

  const { center, zoom } = getMapConfig();

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-border h-[350px] lg:h-[500px] bg-soft-gray">
      {/* Location loading overlay */}
      {locationLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Finding your location...
            </span>
          </div>
        </div>
      )}

      {/* react-leaflet v4 MapContainer */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-10"
        // Expose the internal Leaflet map instance
        ref={mapRef}
      >
        {/* Recentre when userLocation resolves */}
        <ChangeMapView center={center} zoom={zoom} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userMarkerIcon}
          >
            <Popup>
              <div className="text-center font-semibold text-xs p-1">
                Your Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* Charging spot markers */}
        {spots
          .filter((s) => s.coordinates?.lat && s.coordinates?.lng)
          .map((spot) => (
            <Marker
              key={spot.id}
              position={[spot.coordinates.lat, spot.coordinates.lng]}
              icon={spotMarkerIcon}
            >
              <Popup>
                <div className="p-1 space-y-2 min-w-[180px]">
                  <div className="flex items-center gap-1.5 font-bold text-foreground leading-tight text-sm">
                    {spot.name}
                    {spot.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-ev-green flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {spot.city || "Nearby Spot"}
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-xs text-muted-foreground">
                      Price:{" "}
                      <span className="font-bold text-foreground text-sm">
                        ₹{spot.pricePerHour}
                      </span>
                      /hr
                    </div>
                  </div>
                  <button
                    onClick={() => onBookSpot(spot)}
                    className="w-full py-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer min-h-[44px]"
                  >
                    Book Now
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
