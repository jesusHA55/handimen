/**
 * Lightweight geo helpers.
 *
 * The mock layer needs to place listings on a stylized (keyless) map and filter
 * by radius without a database. When Supabase is connected, PostGIS handles the
 * real distance maths — these helpers stay useful for the mock map + tests.
 */

export interface Point {
  lat: number;
  lng: number;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Launch neighbourhood: Poblenou, Barcelona. */
export const POBLENOU_BOUNDS: Bounds = {
  minLat: 41.39,
  maxLat: 41.412,
  minLng: 2.184,
  maxLng: 2.212,
};

export const POBLENOU_CENTER: Point = { lat: 41.4005, lng: 2.1975 };

const EARTH_RADIUS_METERS = 6_371_000;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Project a coordinate to a 0..1 position inside `bounds`.
 * x grows east, y grows south (so y=0 is the top/north edge) — ready for CSS.
 */
export function projectToPercent(point: Point, bounds: Bounds = POBLENOU_BOUNDS) {
  const x = (point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
  const y = 1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
  return { x: clamp01(x), y: clamp01(y) };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in metres. */
export function distanceMeters(a: Point, b: Point): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinRadius(point: Point, center: Point, radiusMeters: number): boolean {
  return distanceMeters(point, center) <= radiusMeters;
}
