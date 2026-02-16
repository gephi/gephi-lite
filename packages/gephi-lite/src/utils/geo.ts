export const MERCATOR_WORLD = { x: [0, 1] as [number, number], y: [0, 1] as [number, number] };
export const MERCATOR_PAN_BOUNDS = { x: [-1, 2] as [number, number], y: [0, 1] as [number, number] };

/**
 * Piecewise smooth clamp: exact identity on [-limit, limit], asymptotic to ±(limit + margin) outside.
 * C2 continuous at the junction (f(limit)=limit, f'(limit)=1, f''(limit)=0).
 */
export function smoothClamp(x: number, limit: number, margin: number): number {
  const ax = Math.abs(x);
  if (ax <= limit) return x;
  const t = (ax - limit) / margin;
  return Math.sign(x) * (limit + (margin * t) / Math.sqrt(1 + t * t));
}

/**
 * Inverse of smoothClamp: maps (-(limit+margin), limit+margin) → (-∞, ∞), identity on [-limit, limit].
 */
export function smoothClampInverse(y: number, limit: number, margin: number): number {
  const ay = Math.abs(y);
  if (ay <= limit) return y;
  const u = ay - limit;
  return Math.sign(y) * (limit + (margin * u) / Math.sqrt(margin * margin - u * u));
}

// Smooth clamp constants for map mode Y coordinates.
// Identity within [-180, 180] (covers Web Mercator's standard range),
// asymptotic toward ±270.
export const MAP_Y_LIMIT = 180;
export const MAP_Y_MARGIN = 90;

export const MERCATOR_SIZE_RATIO = 1 / 360;
