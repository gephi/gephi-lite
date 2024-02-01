import chroma from "chroma-js";
import Color from "color";
import { memoize } from "lodash";
import { RGBColor } from "react-color";

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
