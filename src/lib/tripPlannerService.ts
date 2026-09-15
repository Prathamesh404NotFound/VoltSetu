/**
 * ChargePush Trip Planner Service
 *
 * Provides route fetching and route corridor spot filtering using geocodingService and routingService.
 */

import { calculateDistanceKm } from "@/lib/utils";
import { fetchOsrmRoute, distanceToRouteKm, type OsrmRouteResult } from "@/lib/routeUtils";
import { searchLocation } from "./geocodingService";

export type LatLng = { lat: number; lng: number };

export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const results = await searchLocation(query, { limit: 1 });
  if (!results.length) return null;
  return { lat: results[0].lat, lng: results[0].lng };
}

export interface RouteSpot {
  spot: { id: string; name: string; lat?: number; lng?: number; pricePerHour?: number; city?: string; isAvailable?: boolean };
  distanceFromStartKm: number;
  minDistanceToRouteKm: number;
  pricePerKm: number | null;
}

export async function findSpotsOnRoute(
  start: LatLng,
  end: LatLng,
  spots: Array<{ id: string; name: string; lat?: number; lng?: number; pricePerHour?: number; city?: string; isAvailable?: boolean }>,
  corridorKm = 3
): Promise<{ route: OsrmRouteResult | null; routeSpots: RouteSpot[]; totalKm: number }> {
  const route = await fetchOsrmRoute(start, end);
  const totalKm = route ? route.distanceMeters / 1000 : calculateDistanceKm(start.lat, start.lng, end.lat, end.lng);

  const spotDistances = spots.map((spot) => {
    if (spot.lat == null || spot.lng == null) return null;
    const minToRoute = route ? distanceToRouteKm({ lat: spot.lat, lng: spot.lng }, route.geometry) : Infinity;
    const distFromStart = calculateDistanceKm(start.lat, start.lng, spot.lat, spot.lng);
    return { spot, minToRoute, distFromStart };
  });

  const routeSpots: RouteSpot[] = spotDistances
    .filter((d): d is NonNullable<typeof d> => d !== null && d.minToRoute <= corridorKm)
    .sort((a, b) => a.distFromStart - b.distFromStart)
    .map((d) => ({
      spot: d.spot,
      distanceFromStartKm: Math.round(d.distFromStart * 10) / 10,
      minDistanceToRouteKm: Math.round(d.minToRoute * 100) / 100,
      pricePerKm: d.spot.pricePerHour ? Math.round((d.spot.pricePerHour / 10) * 100) / 100 : null,
    }));

  return { route, routeSpots, totalKm: Math.round(totalKm * 10) / 10 };
}
