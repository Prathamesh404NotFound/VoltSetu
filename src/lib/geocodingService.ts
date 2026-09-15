/**
 * ChargePush Geocoding Service
 *
 * Wraps Nominatim search with:
 * - 650ms debounce
 * - AbortController request cancellation
 * - In-memory LRU search cache
 * - Query length requirement (min 3 chars)
 * - Strict country restriction (India)
 * - Normalized clean labels (e.g., "Rankala Lake, Kolhapur, Maharashtra")
 * - Zero rate-limit abuse
 */

import { MAP_CONFIG } from "./mapConfig";

export interface SearchResultItem {
  id: string;
  name: string;
  subtitle: string;
  fullLabel: string;
  lat: number;
  lng: number;
  type?: string;
}

const cache = new Map<string, SearchResultItem[]>();
const MAX_CACHE_ITEMS = 50;
let activeController: AbortController | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function formatAddressSubtitle(raw: any): { name: string; subtitle: string } {
  const address = raw.address || {};
  const name =
    raw.name ||
    address.amenity ||
    address.tourist ||
    address.building ||
    address.suburb ||
    address.road ||
    raw.display_name.split(",")[0] ||
    "Location";

  const city =
    address.city || address.town || address.village || address.county || address.district || "";
  const state = address.state || "";

  const parts = [city, state].filter(Boolean);
  const subtitle = parts.length > 0 ? parts.join(", ") : "India";

  return {
    name,
    subtitle,
  };
}

export async function searchLocation(
  query: string,
  options?: { limit?: number }
): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const cacheKey = trimmed.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Cancel any in-flight request
  if (activeController) {
    activeController.abort();
  }

  activeController = new AbortController();
  const limit = options?.limit ?? 5;

  const url = `${MAP_CONFIG.GEOCODING_ENDPOINT}/search?q=${encodeURIComponent(
    trimmed
  )}&format=json&addressdetails=1&limit=${limit}&countrycodes=in`;

  try {
    const res = await fetch(url, {
      signal: activeController.signal,
      headers: {
        "Accept-Language": "en",
        "User-Agent": "ChargePush-EV-Network/1.0",
      },
    });

    if (!res.ok) {
      throw new Error(`Geocoding HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: SearchResultItem[] = data
      .map((item: any) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const { name, subtitle } = formatAddressSubtitle(item);
        return {
          id: String(item.place_id || `${lat},${lng}`),
          name,
          subtitle,
          fullLabel: `${name}${subtitle ? `, ${subtitle}` : ""}`,
          lat,
          lng,
          type: item.type || item.class,
        };
      })
      .filter((item): item is SearchResultItem => item !== null);

    // Cache results
    if (cache.size >= MAX_CACHE_ITEMS) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(cacheKey, results);

    return results;
  } catch (err: any) {
    if (err.name === "AbortError") {
      return [];
    }
    console.warn("Geocoding search failed:", err);
    return [];
  } finally {
    activeController = null;
  }
}

/**
 * Debounced search helper for input handlers
 */
export function searchLocationDebounced(
  query: string,
  onResults: (results: SearchResultItem[]) => void,
  delayMs = 650
) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (query.trim().length < 3) {
    onResults([]);
    return;
  }

  debounceTimer = setTimeout(async () => {
    const results = await searchLocation(query);
    onResults(results);
  }, delayMs);
}
