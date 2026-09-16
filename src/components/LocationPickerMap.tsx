/**
 * ChargePush Location Picker Map Component
 *
 * Interactive map for choosing host location pin using MapLibre GL JS + OpenFreeMap tiles.
 * Supports dragging pin, clicking anywhere to drop pin, and flyTo animations.
 */

import { useRef, useEffect } from "react";
import {
  Map as MaplibreMap,
  Marker,
  NavigationControl,
  AttributionControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_CONFIG, CARTO_RASTER_STYLE, OSM_RASTER_STYLE } from "@/lib/mapConfig";
import { getCityFallbackCoordinates } from "@/lib/hostRegistration";

export interface LocationPickerMapProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  accuracyMeters?: number | null;
  height?: string;
  city?: string;
  showZoomControl?: boolean;
  className?: string;
}

export default function LocationPickerMap({
  value,
  onChange,
  accuracyMeters = null,
  height = "350px",
  city = "",
  showZoomControl = true,
  className = "",
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const styleFallbackAttemptedRef = useRef(false);

  // Compute map center
  let center: [number, number] = MAP_CONFIG.DEFAULT_CENTER;
  let zoom = MAP_CONFIG.DEFAULT_ZOOM;

  if (value) {
    center = [value.lng, value.lat];
    zoom = MAP_CONFIG.SPOT_DETAIL_ZOOM;
  } else if (city && city.trim().length > 0) {
    const fallback = getCityFallbackCoordinates(city);
    center = [fallback.lng, fallback.lat];
    zoom = fallback.lat === 20.5937 && fallback.lng === 78.9629 ? 5 : MAP_CONFIG.CITY_DEFAULT_ZOOM;
  } else {
    const fallback = getCityFallbackCoordinates("pune");
    center = [fallback.lng, fallback.lat];
    zoom = MAP_CONFIG.CITY_DEFAULT_ZOOM;
  }

  // Initialize MapLibre GL instance with fail-safe fallback
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: MAP_CONFIG.STYLE_URL,
      center,
      zoom,
      attributionControl: false,
    });

    if (showZoomControl) {
      map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    }

    map.addControl(
      new AttributionControl({
        compact: false,
        customAttribution: MAP_CONFIG.ATTRIBUTION,
      }),
      "bottom-left"
    );

    // Click map -> move pin
    map.on("click", (e) => {
      onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    map.on("load", () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      setTimeout(() => map.resize(), 50);
    });

    map.on("error", (e: any) => {
      const errStr = String(e?.error?.message || e?.error || e?.message || "");
      if (!styleFallbackAttemptedRef.current && (errStr.includes("style") || errStr.includes("fetch") || errStr.includes("VectorTile") || errStr.includes("404") || errStr.includes("Failed"))) {
        styleFallbackAttemptedRef.current = true;
        console.warn("LocationPickerMap tile notice, switching to Carto Voyager tiles...", errStr);
        try {
          map.setStyle(CARTO_RASTER_STYLE as any);
        } catch {
          try { map.setStyle(OSM_RASTER_STYLE as any); } catch {}
        }
        setTimeout(() => map.resize(), 50);
      }
    });

    fallbackTimerRef.current = setTimeout(() => {
      if (!styleFallbackAttemptedRef.current) {
        styleFallbackAttemptedRef.current = true;
        console.warn("LocationPickerMap vector load timeout, activating Carto tiles...");
        try {
          map.setStyle(CARTO_RASTER_STYLE as any);
        } catch {}
      }
      setTimeout(() => map.resize(), 50);
    }, 3500);

    mapRef.current = map;

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (markerRef.current) markerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ResizeObserver to track container resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    observer.observe(containerRef.current);
    if (mapRef.current) {
      mapRef.current.resize();
    }
    return () => observer.disconnect();
  }, []);


  // Update pin position and marker on value changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (value) {
      if (!markerRef.current) {
        const el = document.createElement("div");
        el.className = "location-picker-pin";
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 30 38" fill="none" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,.25));">
            <path d="M15 0C6.71 0 0 6.71 0 15C0 26.25 15 38 15 38C15 38 30 26.25 30 15C30 6.71 23.29 0 15 0Z M15 20.5C11.96 20.5 9.5 18.04 9.5 15C9.5 11.96 11.96 9.5 15 9.5C18.04 9.5 20.5 11.96 20.5 15C20.5 18.04 18.04 20.5 15 20.5Z" fill="#2563EB" stroke="white" stroke-width="2"/>
          </svg>
        `;

        const marker = new Marker({ element: el, draggable: true })
          .setLngLat([value.lng, value.lat])
          .addTo(map);

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          onChange({ lat: lngLat.lat, lng: lngLat.lng });
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([value.lng, value.lat]);
      }

      map.flyTo({ center: [value.lng, value.lat], zoom: 16 });
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value, onChange]);

  const quality = accuracyMeters === null ? null :
    accuracyMeters <= 100 ? "reliable" :
    accuracyMeters <= 1000 ? "approximate" : "imprecise";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Click or drag the pin to set your exact location
      </p>

      <div
        className={`rounded-2xl overflow-hidden border shadow-sm w-full transition-colors ${
          quality === "approximate" ? "border-[#D97706]/30" :
          quality === "imprecise" ? "border-[#D97706]/30" :
          "border-border"
        }`}
        style={{ height }}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {!value && (
        <p className="text-xs text-muted-foreground text-center">
          Tap/click your home location on the map above to set the pin.
        </p>
      )}
    </div>
  );
}
