import iwanthue from "iwanthue";
import { every, values as getValues, reverse } from "lodash";

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
    const palette = iwanthue(values.length, { originalColorsToExpand: currentColors });
    const newColors = reverse(palette.filter((c) => !currentColors.includes(c)));
    return values.reduce(
      (iter, v) => ({ ...iter, [v]: originalPalette && originalPalette[v] ? originalPalette[v] : newColors.pop() }),
      {},
    );
  }
}
