/**
 * ChargePush Primary Map Component
 *
 * Built on MapLibre GL JS + OpenFreeMap with CARTO raster fallback.
 * Renders charging spot markers using GeoJSON source clustering, live status colors,
 * user location tracking, route geometry layer, and interactive popups.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type GeoJSON from "geojson";
import { MAP_CONFIG, CARTO_RASTER_STYLE, normalizeCoordinates } from "@/lib/mapConfig";
import { subscribeToAllAvailability, type SpotAvailability } from "@/lib/availabilityService";
import { getCurrentLocation, getAccuracyLabel, type UserLocationResult } from "@/lib/locationService";
import type { ChargePushMapProps, ChargingSpotItem, SpotGeoJSONProperties } from "./types";
import { BadgeCheck, Loader2, Navigation, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Robust constructor resolution across bundler module types
const MapConstructor = maplibregl.Map || (maplibregl as any).default?.Map || (maplibregl as any).default;
const NavControlConstructor = maplibregl.NavigationControl || (maplibregl as any).default?.NavigationControl;
const AttrControlConstructor = maplibregl.AttributionControl || (maplibregl as any).default?.AttributionControl;
const MarkerConstructor = maplibregl.Marker || (maplibregl as any).default?.Marker;
const LngLatBoundsConstructor = maplibregl.LngLatBounds || (maplibregl as any).default?.LngLatBounds;

export function ChargePushMap({
  spots,
  onBookSpot,
  onSelectSpot,
  selectedSpotId,
  routeGeometry = null,
  destination = null,
  userLocationOverride = null,
  height = "500px",
  showControls = true,
  showRecenter = true,
  className = "",
  emergencyMode = false,
}: ChargePushMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocationResult | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, SpotAvailability>>({});
  const [activePopupSpot, setActivePopupSpot] = useState<ChargingSpotItem | null>(null);
  const [geojsonVersion, setGeojsonVersion] = useState(0);

  // Handler refs for safe removal/re-addition after style changes
  const clusterClickRef = useRef<((e: any) => void) | null>(null);
  const unclusteredClickRef = useRef<((e: any) => void) | null>(null);
  const clusterEnterRef = useRef<(() => void) | null>(null);
  const clusterLeaveRef = useRef<(() => void) | null>(null);
  const unclusteredEnterRef = useRef<(() => void) | null>(null);
  const unclusteredLeaveRef = useRef<(() => void) | null>(null);

  // Subscribe to live spot availability
  useEffect(() => {
    const unsub = subscribeToAllAvailability((avMap) => {
      setAvailabilityMap(avMap);
    });
    return unsub;
  }, []);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new MapConstructor({
        container: mapContainerRef.current,
        style: MAP_CONFIG.STYLE_URL,
        center: MAP_CONFIG.DEFAULT_CENTER,
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        attributionControl: false,
      });

      if (showControls && NavControlConstructor) {
        map.addControl(new NavControlConstructor({ showCompass: false }), "bottom-right");
      }

      if (AttrControlConstructor) {
        map.addControl(
          new AttrControlConstructor({
            compact: false,
            customAttribution: MAP_CONFIG.ATTRIBUTION,
          }),
          "bottom-left"
        );
      }

      map.on("load", () => {
        setMapLoaded(true);
        setTimeout(() => map.resize(), 100);
      });

      // Fallback to raster tiles if vector style loading fails
      map.on("error", (e: any) => {
        if (e?.error?.message?.includes("style") || e?.error?.message?.includes("fetch")) {
          console.warn("OpenFreeMap vector tile warning, using Carto Voyager style fallback...");
          try {
            map.setStyle(CARTO_RASTER_STYLE as any);
          } catch {
            // ignore fallback retry errors
          }
        }
      });

      // Re-add GeoJSON layers after any style change (e.g., vector → raster fallback)
      map.on("style", () => {
        setGeojsonVersion((v) => v + 1);
      });

      mapRef.current = map;
    } catch (err) {
      console.error("MapLibre initialization error:", err);
    }

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ResizeObserver to resize map whenever container dimensions change or tab switches
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Convert spots list to GeoJSON FeatureCollection
  const geojsonSpots = useMemo(() => {
    const features: GeoJSON.Feature<GeoJSON.Point, SpotGeoJSONProperties>[] = spots
      .map((spot) => {
        const rawLat = spot.coordinates?.lat ?? spot.lat;
        const rawLng = spot.coordinates?.lng ?? spot.lng;
        const norm = normalizeCoordinates(rawLat, rawLng);
        if (!norm) return null;

        const av = availabilityMap[spot.id];
        let statusColor: SpotGeoJSONProperties["statusColor"] = "electric";
        let isOccupied = false;

        if (av !== undefined) {
          isOccupied = av.isOccupied;
          statusColor = av.isOccupied ? "amber" : "green";
        }

        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [norm.lng, norm.lat],
          },
          properties: {
            id: spot.id,
            name: spot.name || "Charging Spot",
            pricePerHour: spot.pricePerHour || 0,
            city: spot.city || "India",
            isVerified: Boolean(spot.isVerified),
            isNetworkStation: Boolean(spot.isNetworkStation),
            isOccupied,
            statusColor,
            suggestedStop: false,
            selected: spot.id === selectedSpotId,
          },
        };
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point, SpotGeoJSONProperties> => f !== null);

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [spots, availabilityMap, selectedSpotId]);

  // Update GeoJSON source & layers when map is ready or spots change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const removeHandlers = () => {
      if (clusterClickRef.current) { map.off("click", "clusters", clusterClickRef.current); clusterClickRef.current = null; }
      if (unclusteredClickRef.current) { map.off("click", "unclustered-chargers", unclusteredClickRef.current); unclusteredClickRef.current = null; }
      if (clusterEnterRef.current) { map.off("mouseenter", "clusters", clusterEnterRef.current); clusterEnterRef.current = null; }
      if (clusterLeaveRef.current) { map.off("mouseleave", "clusters", clusterLeaveRef.current); clusterLeaveRef.current = null; }
      if (unclusteredEnterRef.current) { map.off("mouseenter", "unclustered-chargers", unclusteredEnterRef.current); unclusteredEnterRef.current = null; }
      if (unclusteredLeaveRef.current) { map.off("mouseleave", "unclustered-chargers", unclusteredLeaveRef.current); unclusteredLeaveRef.current = null; }
    };

    if (!map.getSource("chargers-source")) {
      removeHandlers();

      map.addSource("chargers-source", {
        type: "geojson",
        data: geojsonSpots,
        cluster: true,
        clusterMaxZoom: MAP_CONFIG.CLUSTER_MAX_ZOOM,
        clusterRadius: MAP_CONFIG.CLUSTER_RADIUS,
      });

      // Cluster Circle Layer
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "chargers-source",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": emergencyMode ? "#DC2626" : "#2563EB",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            5,
            24,
            15,
            30,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
          "circle-opacity": 0.9,
        },
      });

      // Cluster Count Text Layer
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "chargers-source",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 13,
        },
        paint: {
          "text-color": "#FFFFFF",
        },
      });

      // Unclustered Chargers Point Layer
      map.addLayer({
        id: "unclustered-chargers",
        type: "circle",
        source: "chargers-source",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "statusColor"],
            "green",
            "#16A34A",
            "amber",
            "#D97706",
            "gray",
            "#64748B",
            /* default electric */ "#2563EB",
          ],
          "circle-radius": [
            "case",
            ["boolean", ["get", "selected"], false],
            12,
            8,
          ],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Cluster click -> zoom in
      clusterClickRef.current = (e: any) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (clusterId !== undefined) {
          (map.getSource("chargers-source") as maplibregl.GeoJSONSource).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
              if (err || zoom === null) return;
              const coords = (features[0].geometry as GeoJSON.Point).coordinates;
              map.easeTo({ center: [coords[0], coords[1]], zoom: zoom + 1 });
            }
          );
        }
      };
      map.on("click", "clusters", clusterClickRef.current);

      // Individual charger click -> show popup
      unclusteredClickRef.current = (e: any) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const spotId = feature.properties?.id;
        const matchedSpot = spots.find((s) => s.id === spotId);
        if (matchedSpot) {
          setActivePopupSpot(matchedSpot);
          if (onSelectSpot) onSelectSpot(matchedSpot);
        }
      };
      map.on("click", "unclustered-chargers", unclusteredClickRef.current);

      // Cursor hover feedback
      clusterEnterRef.current = () => (map.getCanvas().style.cursor = "pointer");
      clusterLeaveRef.current = () => (map.getCanvas().style.cursor = "");
      unclusteredEnterRef.current = () => (map.getCanvas().style.cursor = "pointer");
      unclusteredLeaveRef.current = () => (map.getCanvas().style.cursor = "");
      map.on("mouseenter", "clusters", clusterEnterRef.current);
      map.on("mouseleave", "clusters", clusterLeaveRef.current);
      map.on("mouseenter", "unclustered-chargers", unclusteredEnterRef.current);
      map.on("mouseleave", "unclustered-chargers", unclusteredLeaveRef.current);
    } else {
      (map.getSource("chargers-source") as maplibregl.GeoJSONSource).setData(geojsonSpots);
    }
  }, [geojsonSpots, mapLoaded, spots, selectedSpotId, onSelectSpot, emergencyMode, geojsonVersion]);

  // Route layer update
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 1) {
      const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        geometry: routeGeometry,
        properties: {},
      };

      if (!map.getSource("route-source")) {
        map.addSource("route-source", {
          type: "geojson",
          data: routeGeoJSON,
        });

        map.addLayer(
          {
            id: "route-line",
            type: "line",
            source: "route-source",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": emergencyMode ? "#DC2626" : "#2563EB",
              "line-width": 5,
              "line-opacity": 0.85,
            },
          },
          "clusters"
        );
      } else {
        (map.getSource("route-source") as maplibregl.GeoJSONSource).setData(routeGeoJSON);
      }

      if (LngLatBoundsConstructor) {
        const bounds = new LngLatBoundsConstructor();
        routeGeometry.coordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
      }
    } else if (map.getSource("route-source")) {
      map.removeLayer("route-line");
      map.removeSource("route-source");
    }
  }, [routeGeometry, mapLoaded, emergencyMode, geojsonVersion]);

  // User location marker & override handling
  const effectiveUserLoc = userLocationOverride ?? (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !MarkerConstructor) return;

    if (effectiveUserLoc) {
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "user-location-pin";
        el.innerHTML = `
          <div style="position:relative;width:24px;height:24px;">
            <style>
              @keyframes user-pulse { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(2.4); opacity: 0; } }
            </style>
            <div style="position:absolute;width:24px;height:24px;background:#2563EB;border-radius:50%;opacity:0.12;animation:user-pulse 1.8s infinite ease-out;"></div>
            <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;background:#2563EB;border:2.5px solid #FFFFFF;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>
          </div>
        `;

        userMarkerRef.current = new MarkerConstructor({ element: el })
          .setLngLat([effectiveUserLoc.lng, effectiveUserLoc.lat])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([effectiveUserLoc.lng, effectiveUserLoc.lat]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [effectiveUserLoc, mapLoaded, geojsonVersion]);

  // Destination marker handling
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !MarkerConstructor) return;

    if (destination) {
      if (!destMarkerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = `
            <div style="width:28px;height:28px;background:#111827;border:2px solid #FFFFFF;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <div style="width:8px;height:8px;background:#FFFFFF;border-radius:50%;transform:rotate(45deg);"></div>
          </div>
        `;
        destMarkerRef.current = new MarkerConstructor({ element: el })
          .setLngLat([destination.lng, destination.lat])
          .addTo(map);
      } else {
        destMarkerRef.current.setLngLat([destination.lng, destination.lat]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [destination, mapLoaded, geojsonVersion]);

  // Trigger camera pan on initial valid bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || routeGeometry) return;

    if (effectiveUserLoc) {
      map.flyTo({ center: [effectiveUserLoc.lng, effectiveUserLoc.lat], zoom: 14 });
    } else if (spots.length > 0 && LngLatBoundsConstructor) {
      const bounds = new LngLatBoundsConstructor();
      let validCount = 0;
      spots.forEach((s) => {
        const norm = normalizeCoordinates(s.coordinates?.lat ?? s.lat, s.coordinates?.lng ?? s.lng);
        if (norm) {
          bounds.extend([norm.lng, norm.lat]);
          validCount++;
        }
      });
      if (validCount > 0) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
      }
    }
  }, [mapLoaded, effectiveUserLoc, spots, routeGeometry, geojsonVersion]);

  // Recenter handler
  const handleRecenter = async () => {
    setLocationLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [loc.lng, loc.lat], zoom: 14 });
      }
    } catch (err) {
      console.warn("Could not center on user location:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  const containerStyle = height && height !== "100%" ? { height } : undefined;

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden shadow-md border border-border bg-card min-h-[350px]",
        className
      )}
      style={containerStyle}
    >
      {/* Loading Overlay */}
      {locationLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-lg border border-border text-xs font-semibold text-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Finding your location...</span>
          </div>
        </div>
      )}

      {/* Recenter Control Button */}
      {showRecenter && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute top-4 right-4 z-10 p-2.5 bg-card/90 backdrop-blur-md hover:bg-card text-foreground rounded-full shadow-md border border-border/80 transition-transform active:scale-95 cursor-pointer"
          title="Recenter on my location"
          aria-label="Recenter on my location"
        >
          <Navigation className="w-4 h-4 text-primary" />
        </button>
      )}

      {/* Accuracy Banner */}
      {userLocation && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-card/90 backdrop-blur-md rounded-full shadow-xs border border-border text-[11px] font-semibold text-muted-foreground">
          {getAccuracyLabel(userLocation.accuracyTier, userLocation.accuracy)}
        </div>
      )}

      {/* Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] relative" />

      {/* Selected Spot Popup / Card Modal */}
      {activePopupSpot && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-sm mx-auto p-4 bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border border-border/80 animate-slide-up">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              {activePopupSpot.name}
              {activePopupSpot.isVerified && <BadgeCheck className="w-4 h-4 text-ev-green" />}
            </div>
            <button
              onClick={() => setActivePopupSpot(null)}
              className="text-xs text-muted-foreground hover:text-foreground p-1"
              aria-label="Close spot card"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {activePopupSpot.city || "Nearby Spot"} • ₹{activePopupSpot.pricePerHour || 0}/hr
          </div>
          <button
            onClick={() => {
              if (onBookSpot) onBookSpot(activePopupSpot);
              setActivePopupSpot(null);
            }}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Request Access
          </button>
        </div>
      )}
    </div>
  );
}

export default ChargePushMap;
