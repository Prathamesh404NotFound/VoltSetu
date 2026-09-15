/**
 * ChargePush Client Routing Service
 *
 * Calls ChargePush route endpoint (/api/route) with:
 * - Rounded coordinate cache keys (4 decimal places ~11m resolution)
 * - In-memory route caching with TTL
 * - Graceful fallback straight-line calculations when offline or routing fails
 * - GeoJSON LineString geometry return format
 */

import { MAP_CONFIG, normalizeCoordinates } from "./mapConfig";
import type { RouteProxyResponse } from "../../api/route";

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: {
    type: "LineString";
    coordinates: Array<[number, number]>;
  };
  isFallback: boolean;
  fallbackLabel?: string;
}

const routeCache = new Map<string, { data: RouteResult; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function getCacheKey(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): string {
  const sLat = start.lat.toFixed(4);
  const sLng = start.lng.toFixed(4);
  const eLat = end.lat.toFixed(4);
  const eLng = end.lng.toFixed(4);
  return `${sLat},${sLng}->${eLat},${eLng}`;
}

export async function fetchRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteResult> {
  const normStart = normalizeCoordinates(start.lat, start.lng);
  const normEnd = normalizeCoordinates(end.lat, end.lng);

  if (!normStart || !normEnd) {
    throw new Error("Invalid start or end coordinates provided to fetchRoute.");
  }

  const cacheKey = getCacheKey(normStart, normEnd);
  const cached = routeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(
      `${MAP_CONFIG.ROUTE_PROXY_ENDPOINT}?startLng=${normStart.lng}&startLat=${normStart.lat}&endLng=${normEnd.lng}&endLat=${normEnd.lat}`
    );

    if (res.ok) {
      const data: RouteProxyResponse = await res.json();
      const result: RouteResult = {
        distanceKm: parseFloat((data.distanceMeters / 1000).toFixed(1)),
        durationMinutes: Math.round(data.durationSeconds / 60),
        geometry: data.geometry,
        isFallback: data.isFallback,
        fallbackLabel: data.fallbackLabel,
      };

      routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn("Serverless route proxy fetch failed, generating client fallback...", err);
  }

  // Client-side straight-line fallback if network fails
  const fallbackDistanceMeters = calculateHaversineMeters(
    normStart.lat,
    normStart.lng,
    normEnd.lat,
    normEnd.lng
  );

  const fallbackResult: RouteResult = {
    distanceKm: parseFloat(((fallbackDistanceMeters * 1.3) / 1000).toFixed(1)),
    durationMinutes: Math.round((fallbackDistanceMeters / 1000 / 35) * 60),
    geometry: {
      type: "LineString",
      coordinates: [
        [normStart.lng, normStart.lat],
        [normEnd.lng, normEnd.lat],
      ],
    },
    isFallback: true,
    fallbackLabel: "Approximate distance (straight-line fallback)",
  };

  return fallbackResult;
}

function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
