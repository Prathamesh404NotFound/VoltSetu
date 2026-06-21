import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCityFallbackCoordinates } from "@/lib/hostRegistration";

// ─────────────────────────────────────────────────────────
// Custom pin icon (matches the host registration modal)
// ─────────────────────────────────────────────────────────
const pinIcon = L.divIcon({
  className: "location-picker-pin",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 30 38" fill="none"
              style="filter:drop-shadow(0 3px 5px rgba(0,0,0,.25));">
           <path d="M15 0C6.71 0 0 6.71 0 15C0 26.25 15 38 15 38C15 38 30 26.25 30 15C30 6.71 23.29 0 15 0Z
                    M15 20.5C11.96 20.5 9.5 18.04 9.5 15C9.5 11.96 11.96 9.5 15 9.5C18.04 9.5 20.5 11.96 20.5 15C20.5 18.04 18.04 20.5 15 20.5Z"
                 fill="hsl(217,91%,60%)" stroke="white" stroke-width="2"/>
         </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38],
});

// ─────────────────────────────────────────────────────────
// Internal helpers (must live inside MapContainer)
// ─────────────────────────────────────────────────────────

/** Smoothly pan/zoom to new coordinates. */
function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [lat, lng, zoom, map]);
  return null;
}

/** Calls invalidateSize once on mount — fixes tile alignment in modal/animated containers. */
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    // Defer so the container has fully painted before we measure it
    const id = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}

/** Draggable marker — calls onDrag with new coords on drag-end. */
function DraggableMarker({
  position,
  onDrag,
}: {
  position: [number, number];
  onDrag: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend: () => {
          const m = markerRef.current;
          if (m) {
            const { lat, lng } = m.getLatLng();
            onDrag(lat, lng);
          }
        },
      }}
    />
  );
}

/** Click anywhere on the map to drop/move the pin. */
function ClickToPlace({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPlace(e.latlng.lat, e.latlng.lng) });
  return null;
}

// ─────────────────────────────────────────────────────────
// Max radius we actually draw — anything above this would
// zoom the whole map out to country level, which is useless.
// ─────────────────────────────────────────────────────────
const MAX_DRAWN_RADIUS_M = 5000;

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────
export interface LocationPickerMapProps {
  /** Current pin position, or null if not yet set. */
  value: { lat: number; lng: number } | null;
  /** Called whenever the user drags the pin or clicks the map. */
  onChange: (coords: { lat: number; lng: number }) => void;
  /**
   * GPS fix accuracy in metres (from position.coords.accuracy).
   * When provided:
   *  - ≤ 5000 m  → draws a translucent blue circle showing the uncertainty radius.
   *  - > 5000 m  → skips the circle (would be absurdly large), shows no overlay.
   */
  accuracyMeters?: number | null;
  /** CSS height of the map container. Default "350px". */
  height?: string;
  /** Optional city name to center on when value is null. */
  city?: string;
  /** Show zoom controls? Default true. */
  showZoomControl?: boolean;
  /** Extra className applied to the outer wrapper div. */
  className?: string;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function LocationPickerMap({
  value,
  onChange,
  accuracyMeters = null,
  height = "350px",
  city = "",
  showZoomControl = true,
  className = "",
}: LocationPickerMapProps) {
  // Determine map center and zoom level dynamically based on current values and fallbacks
  let center: [number, number] = [20.5937, 78.9629];
  let zoom = 5;

  if (value) {
    center = [value.lat, value.lng];
    zoom = 16;
  } else if (city && city.trim().length > 0) {
    const fallback = getCityFallbackCoordinates(city);
    center = [fallback.lat, fallback.lng];
    // If the fallback coordinates matched India's centroid, keep zoomed out
    zoom = fallback.lat === 20.5937 && fallback.lng === 78.9629 ? 5 : 12;
  } else {
    // Default to Pune fallback coordinate
    const fallback = getCityFallbackCoordinates("pune");
    center = [fallback.lat, fallback.lng];
    zoom = 12;
  }

  // Only draw the accuracy circle when the radius is reasonable
  const shouldDrawCircle =
    value !== null &&
    accuracyMeters !== null &&
    accuracyMeters > 0 &&
    accuracyMeters <= MAX_DRAWN_RADIUS_M;

  // Determine GPS quality tier for dynamic border styling
  const quality = accuracyMeters === null ? null :
    accuracyMeters <= 100  ? "reliable" :
    accuracyMeters <= 1000 ? "approximate" : "imprecise";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Instruction caption */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Click or drag the pin to set your exact location
      </p>

      {/* Map container */}
      <div
        className={`rounded-2xl overflow-hidden border shadow-sm w-full transition-colors ${
          quality === "approximate" ? "border-amber-300" :
          quality === "imprecise"   ? "border-orange-400" :
          "border-border"
        }`}
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full"
          zoomControl={showZoomControl}
          attributionControl={true}
          // Suppress the default grey tile-size flash
          style={{ background: "hsl(var(--muted))" }}
        >
          <InvalidateSizeOnMount />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />

          {/* Fly to pin when value changes */}
          {value && <FlyTo lat={value.lat} lng={value.lng} zoom={zoom} />}

          {/* Draggable pin marker */}
          {value && (
            <DraggableMarker
              position={[value.lat, value.lng]}
              onDrag={(lat, lng) => onChange({ lat, lng })}
            />
          )}

          {/* GPS accuracy uncertainty circle */}
          {shouldDrawCircle && (
            <Circle
              center={[value.lat, value.lng]}
              radius={accuracyMeters}
              pathOptions={{
                color: "hsl(217,91%,60%)",
                fillColor: "hsl(217,91%,60%)",
                fillOpacity: 0.12,
                weight: 1.5,
                opacity: 0.5,
              }}
            />
          )}

          {/* Click anywhere to place / move the pin */}
          <ClickToPlace onPlace={(lat, lng) => onChange({ lat, lng })} />
        </MapContainer>
      </div>

      {/* Helper text when no pin is set */}
      {!value && (
        <p className="text-xs text-muted-foreground text-center">
          Tap/click your home location on the map above to set the pin.
        </p>
      )}
    </div>
  );
}
