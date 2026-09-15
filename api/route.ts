/**
 * Serverless Route Proxy Endpoint for ChargePush
 *
 * Runs server-side (Vercel Serverless / API Route).
 * Keeps OpenRouteService credentials secure without exposing keys in frontend JavaScript.
 */

export interface RouteProxyRequest {
  start: [number, number]; // [lng, lat]
  end: [number, number];   // [lng, lat]
  mode?: "driving-car" | "cycling-regular";
}

export interface RouteProxyResponse {
  distanceMeters: number;
  durationSeconds: number;
  geometry: {
    type: "LineString";
    coordinates: Array<[number, number]>;
  };
  isFallback: boolean;
  fallbackLabel?: string;
  error?: string;
}

export default async function handler(req: any, res: any) {
  // CORS & Header handling
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const query = req.query || {};
  const body = req.body || {};

  const startLng = parseFloat(query.startLng || body.startLng || body.start?.[0]);
  const startLat = parseFloat(query.startLat || body.startLat || body.start?.[1]);
  const endLng = parseFloat(query.endLng || body.endLng || body.end?.[0]);
  const endLat = parseFloat(query.endLat || body.endLat || body.end?.[1]);

  if (
    !Number.isFinite(startLat) ||
    !Number.isFinite(startLng) ||
    !Number.isFinite(endLat) ||
    !Number.isFinite(endLng)
  ) {
    return res.status(400).json({ error: "Invalid start or end coordinates." });
  }

  const apiKey = process.env.ORS_API_KEY || process.env.OPENROUTE_SERVICE_KEY;

  // 1. If OpenRouteService API key exists, call current HEIGIT OpenRouteService API
  if (apiKey) {
    try {
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startLng},${startLat}&end=${endLng},${endLat}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json, application/geo+json" },
      });

      if (response.ok) {
        const data = await response.json();
        const feature = data.features?.[0];
        if (feature?.geometry?.coordinates) {
          const summary = feature.properties?.summary || {};
          const result: RouteProxyResponse = {
            distanceMeters: summary.distance || 0,
            durationSeconds: summary.duration || 0,
            geometry: feature.geometry,
            isFallback: false,
          };
          return res.status(200).json(result);
        }
      }
    } catch (err) {
      console.warn("OpenRouteService API call failed, generating fallback...", err);
    }
  }

  // 2. Straight-line fallback calculation if ORS is unavailable or key is omitted
  const straightLineDistanceMeters = calculateHaversineMeters(
    startLat,
    startLng,
    endLat,
    endLng
  );
  // Estimate ~35 km/h urban average speed for driving duration fallback
  const estimatedSeconds = Math.round((straightLineDistanceMeters / 1000 / 35) * 3600);

  const fallbackResult: RouteProxyResponse = {
    distanceMeters: Math.round(straightLineDistanceMeters * 1.3), // 1.3x multiplier for road winding estimate
    durationSeconds: estimatedSeconds,
    geometry: {
      type: "LineString",
      coordinates: [
        [startLng, startLat],
        [endLng, endLat],
      ],
    },
    isFallback: true,
    fallbackLabel: "Approximate distance (straight-line fallback)",
  };

  return res.status(200).json(fallbackResult);
}

function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
