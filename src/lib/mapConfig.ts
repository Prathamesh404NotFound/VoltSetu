/**
 * ChargePush Centralized Map Configuration
 *
 * Uses OpenFreeMap — a zero-cost vector-tile service built on OpenStreetMap and OpenMapTiles.
 * No API keys required. All tile styles and endpoints are configured here.
 */

export const MAP_CONFIG = {
  // Primary Vector Tile Style from OpenFreeMap (Bright street style with clear labels & roads)
  STYLE_URL: "https://tiles.openfreemap.org/styles/bright",

  // Default regional center: Kolhapur / Maharashtra city center
  DEFAULT_CENTER: [74.2433, 16.7050] as [number, number], // [lng, lat] for MapLibre
  DEFAULT_ZOOM: 12,
  CITY_DEFAULT_ZOOM: 13,
  SPOT_DETAIL_ZOOM: 16,

  MIN_ZOOM: 3,
  MAX_ZOOM: 19,

  // GeoJSON Source Clustering Configuration
  CLUSTER_MAX_ZOOM: 11,
  CLUSTER_RADIUS: 50,

  // Attribution strings (Mandatory OpenStreetMap & OpenFreeMap credits)
  ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | &copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>',

  // Service Endpoints
  GEOCODING_ENDPOINT: "https://nominatim.openstreetmap.org",
  ROUTE_PROXY_ENDPOINT: "/api/route",
} as const;

/**
 * Fallback Raster Tile Style Specifications
 * Guarantees crisp map tiles render even if vector tile server or WebGL glyphs stall.
 */
export const CARTO_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    "carto-voyager": {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster" as const,
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const OSM_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    "osm-tiles": {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster" as const,
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * Coordinate Normalization Utility
 * Safely validates and parses latitude and longitude values from any input format
 * (separate lat/lng numbers/strings, {lat, lng} objects, or [lng, lat] coordinate arrays).
 */
export interface NormalizedCoordinates {
  lat: number;
  lng: number;
}

export function normalizeCoordinates(
  latInput: unknown,
  lngInput?: unknown
): NormalizedCoordinates | null {
  let rawLat: unknown = latInput;
  let rawLng: unknown = lngInput;

  // Handle object input passed in first parameter (e.g. { lat, lng } or { latitude, longitude })
  if (latInput && typeof latInput === "object" && !Array.isArray(latInput)) {
    const obj = latInput as Record<string, unknown>;
    rawLat = obj.lat ?? obj.latitude ?? obj.y;
    rawLng = obj.lng ?? obj.longitude ?? obj.long ?? obj.x;
  }

  // Handle array input passed in first parameter (e.g. [lng, lat] or [lat, lng])
  if (Array.isArray(latInput) && latInput.length >= 2) {
    const v1 = parseFloat(String(latInput[0]));
    const v2 = parseFloat(String(latInput[1]));
    if (Number.isFinite(v1) && Number.isFinite(v2)) {
      if (Math.abs(v1) <= 90 && Math.abs(v2) <= 180 && Math.abs(v2) > Math.abs(v1)) {
        rawLat = v1;
        rawLng = v2;
      } else {
        rawLng = v1;
        rawLat = v2;
      }
    }
  }

  if (rawLat === null || rawLat === undefined || rawLng === null || rawLng === undefined) {
    return null;
  }

  const lat = typeof rawLat === "number" ? rawLat : parseFloat(String(rawLat));
  const lng = typeof rawLng === "number" ? rawLng : parseFloat(String(rawLng));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  // Latitude must be [-90, 90], Longitude must be [-180, 180]
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  // Reject (0, 0) default null points
  if (lat === 0 && lng === 0) {
    return null;
  }

  return { lat, lng };
}

