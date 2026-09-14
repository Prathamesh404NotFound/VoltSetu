/* VoltSetu trip planner (Round 13).
 *
 * - fetchRoute(): driving route via OSRM (returns geometry + distance)
 * - spotsOnRoute(): filters a spot list to those within `corridorKm` of the
 *   polyline, annotating each with distanceFromStartKm and estimatedDetour.
 * - Rider-facing inputs: start text (geocoded via Nominatim), destination
 *   text, corridor radius 1–10 km (default 3).
 */
import { calculateDistanceKm } from "@/lib/utils";
import { fetchOsrmRoute, distanceToRouteKm, type OsrmRouteResult } from "@/lib/routeUtils";

export type LatLng = { lat: number; lng: number };

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function geocodeAddress(query: string): Promise<LatLng | null> {
  if (query.trim().length < 4) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
      { headers: { "Accept-Language": "en" } }
    );
    const data: NominatimResult[] = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
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

  const coords = route?.geometry.coordinates ?? [];
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

  void coords;

  return { route, routeSpots, totalKm: Math.round(totalKm * 10) / 10 };
}
