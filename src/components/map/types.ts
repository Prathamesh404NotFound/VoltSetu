/**
 * ChargePush Map Component Interfaces & GeoJSON Feature Definitions
 */

import type { SpotAvailability } from "@/lib/availabilityService";
import type { GeoJSONLineString } from "@/lib/routeUtils";

export interface ChargingSpotItem {
  id: string;
  name: string;
  pricePerHour?: number;
  city?: string;
  address?: string;
  isVerified?: boolean;
  isNetworkStation?: boolean;
  openHours?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  lat?: number;
  lng?: number;
  hostName?: string;
  hostPhone?: string;
}

export interface ChargePushMapProps {
  spots: ChargingSpotItem[];
  onBookSpot?: (spot: ChargingSpotItem) => void;
  onSelectSpot?: (spot: ChargingSpotItem | null) => void;
  selectedSpotId?: string | null;
  routeGeometry?: GeoJSONLineString | null;
  destination?: { lat: number; lng: number; label: string } | null;
  userLocationOverride?: { lat: number; lng: number } | null;
  height?: string;
  interactive?: boolean;
  showControls?: boolean;
  showRecenter?: boolean;
  className?: string;
  emergencyMode?: boolean;
}

export type SpotStatusColor = "electric" | "green" | "amber" | "gray";

export interface SpotGeoJSONProperties {
  id: string;
  name: string;
  pricePerHour: number;
  city: string;
  isVerified: boolean;
  isNetworkStation: boolean;
  isOccupied: boolean;
  statusColor: SpotStatusColor;
  suggestedStop: boolean;
  selected: boolean;
}
