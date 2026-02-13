import iwanthue from "iwanthue";
import { every, values as getValues } from "lodash";

export function isColor(strColor: string): boolean {
  const s = new Option().style;
  s.color = strColor;
  return s.color !== "";
}

export function getPalette(values: string[], originalPalette?: Record<string, string | null>): Record<string, string> {
  if (every(values, (v) => isColor(v))) {
    return values.reduce((iter, v) => ({ ...iter, [v]: v }), {});
  } else {
    const currentColors = getValues(originalPalette).filter((c) => c !== null);
    const palette = iwanthue(values.length, { originalColorsToExpand: currentColors, colorSpace: "all" });
    const newColors = palette.filter((c) => !currentColors.includes(c));
    console.log(currentColors, palette, newColors);
    return values.reduce(
      (iter, v, i) => ({ ...iter, [v]: originalPalette && originalPalette[v] ? originalPalette[v] : newColors[i] }),
      {},
    );
  }
}
