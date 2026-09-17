/**
 * useSpots — centralised React Query hook for the ChargePush spot catalogue.
 *
 * Why this exists:
 *   Before this hook, every page that showed spots (FindSpots, Index) had its
 *   own useEffect that fired raw Firebase reads on mount. Navigating between
 *   pages caused duplicate round-trips. With React Query + a 5-minute stale
 *   time, a user can visit /spots, go to /, and come back with zero extra
 *   Firebase reads.
 *
 * What it fetches (single logical request):
 *   1. getAllChargingSpots()     — host spots from chargingSpots/{id}
 *   2. getAllNetworkStations()   — admin-curated stations from networkStations/{id}
 *   3. getBatchHostSettings()   — all host settings in one parallel batch (N+1 fix)
 *
 * The combined result is the enriched spot array (with isPaused flag) that
 * rider pages render directly.
 */
import { useQuery } from "@tanstack/react-query";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import { getAllNetworkStations, mergeNetworkStations } from "@/lib/networkStationsService";
import { getBatchHostSettings, isHostPaused } from "@/lib/hostSettingsService";

export const SPOTS_QUERY_KEY = ["spots"] as const;

export interface EnrichedSpot {
  id: string;
  name?: string;
  hostName?: string;
  hostId?: string;
  hostPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  outletType?: string;
  pricePerHour?: number;
  rating?: number;
  reviews?: any[];
  totalCharges?: number;
  isVerified?: boolean;
  isNetworkStation?: boolean;
  availableHours?: string;
  amenities?: string[];
  photos?: string[];
  status?: string;
  isPaused: boolean;
  [key: string]: any;
}

async function fetchSpots(): Promise<EnrichedSpot[]> {
  // 1. Fire both data fetches in parallel
  const [rawSpots, networkStations] = await Promise.all([
    getAllChargingSpots(),
    getAllNetworkStations(),
  ]);

  // 2. Merge network stations into the spot list
  const merged = mergeNetworkStations(rawSpots, networkStations);

  // 3. Collect unique hostIds for real host spots (not network stations)
  //    and batch-fetch ALL their settings in one go — O(unique_hosts) reads
  //    instead of O(total_spots) reads.
  const hostOnlyIds = Array.from(
    new Set(
      merged
        .filter((s: any) => !s.isNetworkStation && s.hostId)
        .map((s: any) => s.hostId as string)
    )
  );

  const settingsMap = await getBatchHostSettings(hostOnlyIds);

  // 4. Enrich each spot with isPaused from the settings map
  return merged.map((s: any) => ({
    ...s,
    isPaused: s.isNetworkStation ? false : isHostPaused(settingsMap[s.hostId ?? ""] ?? null),
  }));
}

/**
 * Primary hook — use this anywhere you need the full spot list.
 *
 * staleTime: 5 min  — spots data is relatively stable; no need to refetch on
 *                      every mount or window focus.
 * gcTime:   30 min  — keep data in memory so fast navigation between tabs is
 *                      instant.
 */
export function useSpots() {
  return useQuery<EnrichedSpot[]>({
    queryKey: SPOTS_QUERY_KEY,
    queryFn: fetchSpots,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
