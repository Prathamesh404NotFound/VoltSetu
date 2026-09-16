/**
 * StationMap.tsx
 *
 * Vector-Tile Mapping Engine for VoltSetu built on MapLibre GL JS & OpenFreeMap Liberty tiles.
 * Features real-time Firebase EV station synchronization, GeoJSON source clustering,
 * dual visual treatments (high-performance symbol layers + custom HTML markers),
 * and interactive specification popups with deep-link navigation.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Map as MaplibreMap,
  NavigationControl,
  Marker,
  Popup,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type GeoJSON from "geojson";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase-services";

export interface EVStation {
  id: string;
  name: string;
  chargingType: string;
  ratePerHour: number;
  isAvailable: boolean;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface EVStationGeoJSONProperties {
  id: string;
  name: string;
  chargingType: string;
  ratePerHour: number;
  isAvailable: boolean;
  statusColor: string;
  address: string;
  navigationUrl: string;
}

export interface StationMapProps {
  /** Optional initial stations array (used as fallback before Firebase syncs) */
  initialStations?: EVStation[];
  /** Optional callback when a station marker is selected */
  onSelectStation?: (station: EVStation) => void;
  /** Custom map container height */
  height?: string;
  /** Center coordinates override [lng, lat] */
  center?: [number, number];
  /** Zoom level override */
  zoom?: number;
  /** Visual marker style mode: 'vector-layer' | 'custom-html' | 'hybrid' */
  markerMode?: "vector-layer" | "custom-html" | "hybrid";
  /** Additional wrapper CSS classes */
  className?: string;
}

const DEFAULT_KOLHAPUR_CENTER: [number, number] = [74.2433, 16.7050]; // [Longitude, Latitude]
const OPENFREEMAP_BRIGHT_STYLE = "https://tiles.openfreemap.org/styles/bright";

export function StationMap({
  initialStations = [],
  onSelectStation,
  height = "550px",
  center = DEFAULT_KOLHAPUR_CENTER,
  zoom = 12,
  markerMode = "hybrid",
  className = "",
}: StationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const htmlMarkersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [stations, setStations] = useState<EVStation[]>(initialStations);

  // Convert raw station payload into valid GeoJSON FeatureCollection
  const buildGeoJSONPayload = useCallback(
    (stationList: EVStation[]): GeoJSON.FeatureCollection<GeoJSON.Point, EVStationGeoJSONProperties> => {
      const features: GeoJSON.Feature<GeoJSON.Point, EVStationGeoJSONProperties>[] = stationList
        .filter((st) => Number.isFinite(st.lat) && Number.isFinite(st.lng) && st.lat !== 0 && st.lng !== 0)
        .map((st) => {
          const isAvail = Boolean(st.isAvailable);
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}`;

          return {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [st.lng, st.lat],
            },
            properties: {
              id: st.id,
              name: st.name || "VoltSetu EV Charger",
              chargingType: st.chargingType || "AC Type 2 (Fast)",
              ratePerHour: st.ratePerHour || 120,
              isAvailable: isAvail,
              statusColor: isAvail ? "#16A34A" : "#DC2626", // Green for available, Red for occupied
              address: st.address || st.city || "Kolhapur, MH",
              navigationUrl: navUrl,
            },
          };
        });

      return {
        type: "FeatureCollection" as const,
        features,
      };
    },
    []
  );

  // 1. Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: mapContainerRef.current,
      style: OPENFREEMAP_BRIGHT_STYLE,
      center: center,
      zoom: zoom,
      minZoom: 4,
      maxZoom: 19,
      attributionControl: true,
    });

    map.addControl(new NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      // Clear custom HTML markers
      htmlMarkersRef.current.forEach((m) => m.remove());
      htmlMarkersRef.current = [];

      if (popupRef.current) {
        popupRef.current.remove();
      }

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Firebase Realtime Data Listener
  useEffect(() => {
    // Listen on chargingSpots RTDB path
    const spotsRef = ref(database, "chargingSpots");

    const unsubscribe = onValue(
      spotsRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const val = snapshot.val();
        const parsedList: EVStation[] = [];

        if (Array.isArray(val)) {
          val.forEach((item, idx) => {
            if (item) {
              parsedList.push({
                id: item.id || `spot-${idx}`,
                name: item.name || "VoltSetu Station",
                chargingType: item.chargingType || item.chargerType || "CCS2 Fast Charger",
                ratePerHour: item.pricePerHour || item.ratePerHour || 150,
                isAvailable: item.isAvailable !== false,
                lat: item.lat || item.coordinates?.lat || 16.705,
                lng: item.lng || item.coordinates?.lng || 74.243,
                address: item.address || "",
                city: item.city || "Kolhapur",
              });
            }
          });
        } else if (typeof val === "object") {
          Object.keys(val).forEach((key) => {
            const item = val[key];
            if (item) {
              parsedList.push({
                id: key,
                name: item.name || "VoltSetu Station",
                chargingType: item.chargingType || item.chargerType || "CCS2 Fast Charger",
                ratePerHour: item.pricePerHour || item.ratePerHour || 150,
                isAvailable: item.isAvailable !== false,
                lat: item.lat || item.coordinates?.lat || 16.705,
                lng: item.lng || item.coordinates?.lng || 74.243,
                address: item.address || "",
                city: item.city || "Kolhapur",
              });
            }
          });
        }

        if (parsedList.length > 0) {
          setStations(parsedList);
        }
      },
      (error) => {
        console.warn("Firebase RTDB Station Listener Notice:", error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Render / Update GeoJSON Data Source & Vector Layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const geojsonData = buildGeoJSONPayload(stations);

    // Source Management
    if (!map.getSource("ev-stations")) {
      map.addSource("ev-stations", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster Circle Layer
      map.addLayer({
        id: "ev-clusters",
        type: "circle",
        source: "ev-stations",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#2563EB", // Electric blue for small clusters
            5,
            "#06B6D4", // Cyan for medium clusters
            15,
            "#1D4ED8", // Deep blue for large clusters
          ],
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 30],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Cluster Count Text Layer
      map.addLayer({
        id: "ev-cluster-count",
        type: "symbol",
        source: "ev-stations",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Regular", "Open Sans Bold", "Arial Unicode MS Regular"],
          "text-size": 13,
        },
        paint: {
          "text-color": "#FFFFFF",
        },
      });

      // High-Performance Vector Symbol Layer (Treatment 1)
      if (markerMode === "vector-layer" || markerMode === "hybrid") {
        map.addLayer({
          id: "ev-stations-outer-ring",
          type: "circle",
          source: "ev-stations",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["get", "statusColor"],
            "circle-radius": 12,
            "circle-opacity": 0.25,
          },
        });

        map.addLayer({
          id: "ev-stations-pin",
          type: "circle",
          source: "ev-stations",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["get", "statusColor"],
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF",
          },
        });
      }

      // Cursor & Click Interactivity for Vector Layer
      map.on("mouseenter", "ev-stations-pin", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "ev-stations-pin", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "ev-stations-pin", (e) => {
        if (!e.features || !e.features[0]) return;
        const feature = e.features[0];
        const props = feature.properties as EVStationGeoJSONProperties;
        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        openStationPopup(map, coords, props);

        const foundStation = stations.find((s) => s.id === props.id);
        if (foundStation && onSelectStation) {
          onSelectStation(foundStation);
        }
      });
    } else {
      // Direct Data Source Update without Context Reloading
      (map.getSource("ev-stations") as GeoJSONSource).setData(geojsonData);
    }
  }, [mapLoaded, stations, markerMode, buildGeoJSONPayload, onSelectStation]);

  // 4. Custom HTML Element Markers (Treatment 2)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (markerMode === "custom-html" || markerMode === "hybrid") {
      // Clear existing HTML markers
      htmlMarkersRef.current.forEach((m) => m.remove());
      htmlMarkersRef.current = [];

      stations.forEach((st) => {
        if (!Number.isFinite(st.lat) || !Number.isFinite(st.lng) || (st.lat === 0 && st.lng === 0)) return;

        const customDiv = document.createElement("div");
        const isAvail = Boolean(st.isAvailable);

        customDiv.className = "voltsetu-custom-marker-wrapper";
        customDiv.style.cssText = `
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%);
        `;

        customDiv.innerHTML = `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            background: #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(17, 24, 39, 0.2);
            border: 2px solid ${isAvail ? "#16A34A" : "#DC2626"};
            transition: transform 0.2s ease;
          " class="marker-bubble">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isAvail ? "#16A34A" : "#DC2626"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: ${isAvail ? "#16A34A" : "#DC2626"};
              border: 1.5px solid #FFFFFF;
            "></span>
          </div>
        `;

        const marker = new Marker({ element: customDiv })
          .setLngLat([st.lng, st.lat])
          .addTo(map);

        customDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}`;
          openStationPopup(map, [st.lng, st.lat], {
            id: st.id,
            name: st.name,
            chargingType: st.chargingType,
            ratePerHour: st.ratePerHour,
            isAvailable: isAvail,
            statusColor: isAvail ? "#16A34A" : "#DC2626",
            address: st.address || st.city || "Kolhapur",
            navigationUrl: navUrl,
          });

          if (onSelectStation) {
            onSelectStation(st);
          }
        });

        htmlMarkersRef.current.push(marker);
      });
    }
  }, [mapLoaded, stations, markerMode, onSelectStation]);

  // Popup Helper Function
  function openStationPopup(
    map: MaplibreMap,
    coords: [number, number],
    props: EVStationGeoJSONProperties
  ) {
    if (popupRef.current) {
      popupRef.current.remove();
    }

    const popupNode = document.createElement("div");
    popupNode.className = "voltsetu-station-popup-card";
    popupNode.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 10px 12px; min-width: 220px;">
        <div style="display: flex; items-center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #111827;">${props.name}</h4>
          <span style="
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 9999px;
            background-color: ${props.isAvailable ? "#DCFCE7" : "#FEE2E2"};
            color: ${props.isAvailable ? "#166534" : "#991B1B"};
          ">
            ${props.isAvailable ? "Available" : "Occupied"}
          </span>
        </div>
        
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569;">${props.address}</p>

        <div style="display: flex; flex-direction: column; gap: 4px; padding: 8px; background: #F8FAFC; border-radius: 8px; margin-bottom: 10px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; color: #334155;">
            <span>Charger Type:</span>
            <strong style="color: #111827;">${props.chargingType}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; color: #334155;">
            <span>Charging Rate:</span>
            <strong style="color: #2563EB;">₹${props.ratePerHour}/hr</strong>
          </div>
        </div>

        <a 
          href="${props.navigationUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 8px 12px;
            background: #2563EB;
            color: #FFFFFF;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            text-decoration: none;
            box-sizing: border-box;
            transition: background 0.2s ease;
          "
          onmouseover="this.style.background='#1D4ED8'"
          onmouseout="this.style.background='#2563EB'"
        >
          <span>Navigate with Google Maps</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      </div>
    `;

    const popup = new Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: "300px",
      offset: 15,
    })
      .setLngLat(coords)
      .setDOMContent(popupNode)
      .addTo(map);

    popupRef.current = popup;
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 ${className}`}>
      <div ref={mapContainerRef} style={{ height }} className="w-full h-full" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-600 tracking-wide">Loading Vector Map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
