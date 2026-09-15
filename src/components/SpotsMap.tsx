/**
 * ChargePush SpotsMap Component
 *
 * Wrapper component maintaining backwards compatibility for existing pages while routing
 * rendering through ChargePushMap (MapLibre GL JS + OpenFreeMap).
 */

import React from "react";
import { ChargePushMap } from "./map/ChargePushMap";
import type { GeoJSONLineString } from "@/lib/routeUtils";

interface SpotsMapProps {
  spots: any[];
  onBookSpot: (spot: any) => void;
  routeGeometry?: GeoJSONLineString | null;
  destination?: { lat: number; lng: number; label: string } | null;
  userLocationOverride?: { lat: number; lng: number } | null;
  selectedSpotId?: string | null;
}

export default function SpotsMap({
  spots,
  onBookSpot,
  routeGeometry = null,
  destination = null,
  userLocationOverride = null,
  selectedSpotId = null,
}: SpotsMapProps) {
  return (
    <ChargePushMap
      spots={spots}
      onBookSpot={onBookSpot}
      selectedSpotId={selectedSpotId}
      routeGeometry={routeGeometry}
      destination={destination}
      userLocationOverride={userLocationOverride}
      height="100%"
      className="h-[350px] lg:h-[500px]"
    />
  );
}
