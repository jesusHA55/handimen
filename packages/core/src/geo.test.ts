import { describe, expect, it } from "vitest";

import {
  POBLENOU_BOUNDS,
  POBLENOU_CENTER,
  distanceMeters,
  isWithinRadius,
  projectToPercent,
} from "./geo";

describe("projectToPercent", () => {
  it("maps the bounds extremes to 0 and 1", () => {
    expect(projectToPercent({ lat: POBLENOU_BOUNDS.maxLat, lng: POBLENOU_BOUNDS.minLng })).toEqual({
      x: 0,
      y: 0,
    });
    expect(projectToPercent({ lat: POBLENOU_BOUNDS.minLat, lng: POBLENOU_BOUNDS.maxLng })).toEqual({
      x: 1,
      y: 1,
    });
  });

  it("keeps the neighbourhood centre inside the unit square", () => {
    const { x, y } = projectToPercent(POBLENOU_CENTER);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(1);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(1);
  });

  it("clamps points outside the bounds", () => {
    const { x, y } = projectToPercent({ lat: 0, lng: 0 });
    expect(x).toBe(0);
    expect(y).toBe(1);
  });
});

describe("distanceMeters", () => {
  it("is ~0 for the same point", () => {
    expect(distanceMeters(POBLENOU_CENTER, POBLENOU_CENTER)).toBeLessThan(1);
  });

  it("is roughly 1.1 km between Poblenou centre and the beach", () => {
    const beach = { lat: 41.3915, lng: 2.2075 };
    const distance = distanceMeters(POBLENOU_CENTER, beach);
    expect(distance).toBeGreaterThan(700);
    expect(distance).toBeLessThan(1600);
  });
});

describe("isWithinRadius", () => {
  it("includes nearby points and excludes far ones", () => {
    const nearby = { lat: 41.4001, lng: 2.1976 };
    const far = { lat: 41.412, lng: 2.211 };
    expect(isWithinRadius(nearby, POBLENOU_CENTER, 500)).toBe(true);
    expect(isWithinRadius(far, POBLENOU_CENTER, 200)).toBe(false);
  });
});
