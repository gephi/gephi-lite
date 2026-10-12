import chroma from "chroma-js";
import Color from "color";
import { memoize } from "lodash";
import { RGBColor } from "react-color";
import { HTML_COLORS } from "sigma/utils";

/** How much of the theme's background tone is mixed into the color of the nodes set aside (0 to 1). */
export const DIMMING_RATIO = 0.9;
/** Same, for the edges set aside: they are thin, so they need to fade further to stay out of the way. */
export const DIMMED_EDGE_RATIO = 0.96;

// The cache key must include the ratio (memoize only keys on the first argument by default).
const mixWith = (tone: string) =>
  memoize(
    (color: string, ratio: number = DIMMING_RATIO) => chroma.mix(color, tone, ratio).hex(),
    (color, ratio) => `${color}|${ratio}`,
  );
export const memoizedBrighten = mixWith("white");
export const memoizedDarken = mixWith("black");

export function hexToRgba(value: string): RGBColor {
  const parsed = Color(value);
  return { r: parsed.red(), g: parsed.green(), b: parsed.blue(), a: parsed.alpha() };
}

export function rgbaToHex(value: RGBColor): string {
  const parsed = Color({ r: value.r, g: value.g, b: value.b }).alpha(value.a || 1);
  return parsed.hexa();
}

export function isValidColor(value: string): boolean {
  return (
    !!HTML_COLORS[value] ||
    !!value.match(/^#(?:[0-9a-fA-F]{3,4}){1,2}$/) ||
    !!value.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/) ||
    !!value.match(/^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*\d\)$/)
  );
}
