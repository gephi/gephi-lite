import iwanthue, { ColorSpaceArray, ColorSpacePreset } from "iwanthue";
import { labToHcl, rgbHexToLab } from "iwanthue/helpers";
import presets from "iwanthue/presets";
import { every, values as getValues, reverse, sortBy, toPairs } from "lodash";

export function isColor(strColor: string): boolean {
  const s = new Option().style;
  s.color = strColor;
  return s.color !== "";
}

const colorSpacePresetsAreas = sortBy(
  (toPairs(presets) as [ColorSpacePreset, ColorSpaceArray][]).map(([presetKey, preset]) => {
    // hRange can be expressed as a range from 330 to 360 and from 0 to 20 as [330, 20]
    // in that case the range has to be calculated differently
    const hRange = preset[1] >= preset[0] ? preset[1] - preset[0] : 360 - preset[0] + preset[1];
    return {
      key: presetKey,
      area: hRange * (preset[3] - preset[2]) * (preset[5] - preset[4]),
    };
  }),
  ({ area }) => area,
);

export const colorSpacePresetsSortedByArea = colorSpacePresetsAreas.map(({ key }) => key);

export function detectSmallestCompatibleColorSpace(hexColors: string[]) {
  const colorSpace = colorSpacePresetsSortedByArea.find((presetKey) => {
    // test that all colors are include din the color area
    const areaBounds = presets[presetKey];
    return hexColors
      .map((c) => labToHcl(rgbHexToLab(c)))
      .every(
        ([h, c, l]) =>
          (areaBounds[0] <= areaBounds[1]
            ? areaBounds[0] <= h && h <= areaBounds[1]
            : areaBounds[0] <= h || h <= areaBounds[1]) &&
          areaBounds[2] <= c &&
          c <= areaBounds[3] &&
          areaBounds[4] <= l &&
          l <= areaBounds[5],
      );
  });

  return colorSpace;
}

export function getPalette(values: string[], originalPalette?: Record<string, string | null>): Record<string, string> {
  if (every(values, (v) => isColor(v))) {
    return values.reduce((iter, v) => ({ ...iter, [v]: v }), {});
  } else {
    const currentColors = getValues(originalPalette).filter((c) => c !== null);
    // heuristics to detect colorSpace: find the smallest area which contains all origin colors
    const colorSpace = detectSmallestCompatibleColorSpace(currentColors);
    const palette = iwanthue(values.length, { originalColorsToExpand: currentColors, colorSpace });
    const newColors = reverse(palette.filter((c) => !currentColors.includes(c)));
    return values.reduce(
      (iter, v) => ({ ...iter, [v]: originalPalette && originalPalette[v] ? originalPalette[v] : newColors.pop() }),
      {},
    );
  }
}
