import { describe, it, expect } from "vitest";
import { normalizeCoordinates } from "../mapConfig";
import { distanceToRouteKm, distanceAlongRouteKm, type GeoJSONLineString } from "../routeUtils";
import { getAccuracyLabel } from "../locationService";

describe("Map Architecture & Location Services", () => {
  describe("Coordinate Normalization", () => {
    it("parses valid numbers correctly", () => {
      const result = normalizeCoordinates(16.705, 74.2433);
      expect(result).toEqual({ lat: 16.705, lng: 74.2433 });
    });

    it("parses numeric strings", () => {
      const result = normalizeCoordinates("20.5937", "78.9629");
      expect(result).toEqual({ lat: 20.5937, lng: 78.9629 });
    });

    it("rejects invalid or null coordinates", () => {
      expect(normalizeCoordinates(null, 74.24)).toBeNull();
      expect(normalizeCoordinates(100, 74.24)).toBeNull(); // lat > 90
      expect(normalizeCoordinates(16.7, 200)).toBeNull(); // lng > 180
      expect(normalizeCoordinates("invalid", "12.3")).toBeNull();
      expect(normalizeCoordinates(0, 0)).toBeNull();
    });
  });

  describe("Location Accuracy Tiers", () => {
    it("returns correct user labels for accuracy tiers", () => {
      expect(getAccuracyLabel("precise")).toContain("Precise location");
      expect(getAccuracyLabel("good", 45)).toContain("45m");
      expect(getAccuracyLabel("approximate", 150)).toContain("150m");
    });
  });

  describe("Geographic Route Distance Calculations", () => {
    const mockRoute: GeoJSONLineString = {
      type: "LineString",
      coordinates: [
        [74.2433, 16.705],
        [74.25, 16.71],
        [74.26, 16.72],
      ],
    };

    it("calculates perpendicular distance from point to route line", () => {
      const point = { lat: 16.705, lng: 74.2433 };
      const dist = distanceToRouteKm(point, mockRoute);
      expect(dist).toBeCloseTo(0, 1);
    });

    it("calculates distance along route", () => {
      const point = { lat: 16.705, lng: 74.2433 };
      const along = distanceAlongRouteKm(point, mockRoute);
      expect(along).toBe(0);
    });
  });
});
