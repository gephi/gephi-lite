import chroma from "chroma-js";
import Color from "color";
import { memoize } from "lodash";
import { RGBColor } from "react-color";
import { HTML_COLORS } from "sigma/utils";

export const memoizedBrighten = memoize((color: string) => chroma.mix(color, "white", 0.75).hex());
export const memoizedDarken = memoize((color: string) => chroma.mix(color, "black", 0.75).hex());

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
