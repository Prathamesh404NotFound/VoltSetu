import { calculateDistanceKm } from "@/lib/utils";

export type LatLng = { lat: number; lng: number };

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface OsrmRouteResult {
  geometry: GeoJSONLineString;
  distanceMeters: number;
}

const OSRM_BASE = "https://router.project-osrm.org";

export async function fetchOsrmRoute(start: LatLng, end: LatLng): Promise<OsrmRouteResult | null> {
  const url = `${OSRM_BASE}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry) return null;
    return {
      geometry: data.routes[0].geometry as GeoJSONLineString,
      distanceMeters: data.routes[0].distance as number,
    };
  } catch {
    return null;
  }
}

function pointToSegmentDistanceKm(point: LatLng, segStart: LatLng, segEnd: LatLng): number {
  const segLenSq =
    (segEnd.lat - segStart.lat) ** 2 + (segEnd.lng - segStart.lng) ** 2;
  if (segLenSq === 0) {
    return calculateDistanceKm(point.lat, point.lng, segStart.lat, segStart.lng);
  }
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.lat - segStart.lat) * (segEnd.lat - segStart.lat) +
        (point.lng - segStart.lng) * (segEnd.lng - segStart.lng)) /
        segLenSq
    )
  );
  const projLat = segStart.lat + t * (segEnd.lat - segStart.lat);
  const projLng = segStart.lng + t * (segEnd.lng - segStart.lng);
  return calculateDistanceKm(point.lat, point.lng, projLat, projLng);
}

/** Minimum perpendicular distance from a point to a route polyline (km). */
export function distanceToRouteKm(point: LatLng, geometry: GeoJSONLineString): number {
  const coords = geometry.coordinates;
  if (coords.length < 2) return Infinity;

  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    const d = pointToSegmentDistanceKm(
      point,
      { lat: lat1, lng: lng1 },
      { lat: lat2, lng: lng2 }
    );
    if (d < min) min = d;
  }
  return min;
}

/** Approximate distance from route start to the nearest point on the route (km). */
export function distanceAlongRouteKm(point: LatLng, geometry: GeoJSONLineString): number {
  const coords = geometry.coordinates;
  if (coords.length < 2) return 0;

  let minDist = Infinity;
  let bestAlong = 0;
  let accumulated = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    const segLen = calculateDistanceKm(lat1, lng1, lat2, lng2);
    const segLenSq = (lat2 - lat1) ** 2 + (lng2 - lng1) ** 2;

    let t = 0;
    if (segLenSq > 0) {
      t = Math.max(
        0,
        Math.min(
          1,
          ((point.lat - lat1) * (lat2 - lat1) + (point.lng - lng1) * (lng2 - lng1)) / segLenSq
        )
      );
    }

    const projLat = lat1 + t * (lat2 - lat1);
    const projLng = lng1 + t * (lng2 - lng1);
    const distToSeg = calculateDistanceKm(point.lat, point.lng, projLat, projLng);

    if (distToSeg < minDist) {
      minDist = distToSeg;
      bestAlong = accumulated + segLen * t;
    }
    accumulated += segLen;
  }

  return bestAlong;
}

/** Find spot id closest to a target distance along the route. */
export function findSuggestedStopId(
  spots: Array<{ id?: string; coordinates?: { lat: number; lng: number } }>,
  geometry: GeoJSONLineString,
  targetDistanceKm: number
): string | undefined {
  let bestId: string | undefined;
  let bestDelta = Infinity;

  for (const spot of spots) {
    if (!spot.id || !spot.coordinates) continue;
    const along = distanceAlongRouteKm(spot.coordinates, geometry);
    const delta = Math.abs(along - targetDistanceKm);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestId = spot.id;
    }
  }

  return bestId;
}

export const ROUTE_CORRIDOR_KM = 2;
export const DESTINATION_FALLBACK_RADIUS_KM = 8;
