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
 * Fallback Raster Tile Style Specification
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

/**
 * Coordinate Normalization Utility
 * Safely validates and parses latitude and longitude values from any input format.
 */
export interface NormalizedCoordinates {
  lat: number;
  lng: number;
}

export function normalizeCoordinates(
  latInput: unknown,
  lngInput: unknown
): NormalizedCoordinates | null {
  if (latInput === null || latInput === undefined || lngInput === null || lngInput === undefined) {
    return null;
  }

  const lat = typeof latInput === "number" ? latInput : parseFloat(String(latInput));
  const lng = typeof lngInput === "number" ? lngInput : parseFloat(String(lngInput));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  // Latitude must be [-90, 90], Longitude must be [-180, 180]
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  // Reject (0, 0) default null points unless explicitly valid
  if (lat === 0 && lng === 0) {
    return null;
  }

  return { lat, lng };
}
