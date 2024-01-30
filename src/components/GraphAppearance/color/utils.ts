import { every } from "lodash";
import iwanthue from "iwanthue";

export function isColor(strColor: string): boolean {
  const s = new Option().style;
  s.color = strColor;
  return s.color !== "";
}

export function getPalette(values: string[]): Record<string, string> {
  if (every(values, (v) => isColor(v))) {
    return values.reduce((iter, v) => ({ ...iter, [v]: v }), {});
  } else {
    const palette = iwanthue(values.length);
    return values.reduce((iter, v, i) => ({ ...iter, [v]: palette[i] }), {});
  }
}
