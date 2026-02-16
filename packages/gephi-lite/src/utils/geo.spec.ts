import { describe, expect, it } from "vitest";

import { MAP_Y_LIMIT, MAP_Y_MARGIN, smoothClamp, smoothClampInverse } from "./geo";

describe("smoothClamp / smoothClampInverse", () => {
  const LIMIT = 85;
  const MARGIN = 5;

  it("should be exact identity on [-limit, limit]", () => {
    const values = [-85, -60, -30, -10, 0, 10, 30, 60, 85];
    for (const x of values) {
      expect(smoothClamp(x, LIMIT, MARGIN)).toBe(x);
    }
  });

  it("should never reach +/-(limit + margin) (asymptotic bound)", () => {
    const asymptote = LIMIT + MARGIN;
    expect(smoothClamp(1000, LIMIT, MARGIN)).toBeLessThan(asymptote);
    expect(smoothClamp(-1000, LIMIT, MARGIN)).toBeGreaterThan(-asymptote);
    expect(smoothClamp(1e6, LIMIT, MARGIN)).toBeLessThan(asymptote);
    expect(smoothClamp(-1e6, LIMIT, MARGIN)).toBeGreaterThan(-asymptote);
  });

  it("should be odd (antisymmetric)", () => {
    expect(smoothClamp(100, LIMIT, MARGIN)).toBeCloseTo(-smoothClamp(-100, LIMIT, MARGIN), 10);
    expect(smoothClamp(200, LIMIT, MARGIN)).toBeCloseTo(-smoothClamp(-200, LIMIT, MARGIN), 10);
  });

  it("should be monotonically increasing", () => {
    const values = [-200, -100, -86, -85, -50, 0, 50, 85, 86, 100, 200];
    const clamped = values.map((v) => smoothClamp(v, LIMIT, MARGIN));
    for (let i = 1; i < clamped.length; i++) {
      expect(clamped[i]).toBeGreaterThan(clamped[i - 1]);
    }
  });

  it("should be C2 continuous at the junction (derivative ~1, second derivative ~0)", () => {
    const h = 1e-6;

    const fPrime = (smoothClamp(LIMIT + h, LIMIT, MARGIN) - smoothClamp(LIMIT - h, LIMIT, MARGIN)) / (2 * h);
    expect(fPrime).toBeCloseTo(1, 4);

    const fDoublePrime =
      (smoothClamp(LIMIT + h, LIMIT, MARGIN) -
        2 * smoothClamp(LIMIT, LIMIT, MARGIN) +
        smoothClamp(LIMIT - h, LIMIT, MARGIN)) /
      (h * h);
    expect(Math.abs(fDoublePrime)).toBeLessThan(0.01);
  });

  it("smoothClampInverse should roundtrip for values within [-limit, limit]", () => {
    const values = [-80, -50, -10, 0, 10, 50, 80];
    for (const x of values) {
      const y = smoothClamp(x, LIMIT, MARGIN);
      expect(smoothClampInverse(y, LIMIT, MARGIN)).toBeCloseTo(x, 10);
    }
  });

  it("smoothClampInverse should roundtrip for values beyond ±limit", () => {
    const values = [-200, -100, -86, 86, 100, 200];
    for (const x of values) {
      const y = smoothClamp(x, LIMIT, MARGIN);
      expect(smoothClampInverse(y, LIMIT, MARGIN)).toBeCloseTo(x, 6);
    }
  });

  it("should work with map Y constants (limit=180, margin=90)", () => {
    // Identity within [-180, 180]
    expect(smoothClamp(180, MAP_Y_LIMIT, MAP_Y_MARGIN)).toBe(180);
    expect(smoothClamp(-180, MAP_Y_LIMIT, MAP_Y_MARGIN)).toBe(-180);
    expect(smoothClamp(100, MAP_Y_LIMIT, MAP_Y_MARGIN)).toBe(100);

    // Beyond limit: clamped below asymptote (270)
    expect(smoothClamp(500, MAP_Y_LIMIT, MAP_Y_MARGIN)).toBeLessThan(270);
    expect(smoothClamp(500, MAP_Y_LIMIT, MAP_Y_MARGIN)).toBeGreaterThan(180);

    // Roundtrip
    const y = smoothClamp(300, MAP_Y_LIMIT, MAP_Y_MARGIN);
    expect(smoothClampInverse(y, MAP_Y_LIMIT, MAP_Y_MARGIN)).toBeCloseTo(300, 6);
  });
});
