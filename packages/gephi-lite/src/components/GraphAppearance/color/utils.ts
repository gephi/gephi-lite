import iwanthue, { ColorSpace } from "iwanthue";
import { every, values as getValues, reverse } from "lodash";

export function isColor(strColor: string): boolean {
  const s = new Option().style;
  s.color = strColor;
  return s.color !== "";
}

export function getPalette(
  values: string[],
  options?: { originalPalette?: Record<string, string | null>; colorSpace?: ColorSpace },
): Record<string, string> {
  if (every(values, (v) => isColor(v))) {
    return values.reduce((iter, v) => ({ ...iter, [v]: v }), {});
  } else {
    const currentColors = options?.originalPalette
      ? getValues(options.originalPalette).filter((c) => c !== null)
      : null;
    const palette = iwanthue(values.length, {
      // issue in iwanthue requires originColorsToExpand to be null not undefined
      // TODO: remove cast once bug resolved upstream
      originalColorsToExpand: currentColors || undefined,
      colorSpace: options?.colorSpace,
    });
    const newColors = reverse(palette.filter((c) => !currentColors || !currentColors.includes(c)));
    return values.reduce(
      (iter, v) => ({
        ...iter,
        [v]: options?.originalPalette && options?.originalPalette[v] ? options?.originalPalette[v] : newColors.pop(),
      }),
      {},
    );
  }
}
