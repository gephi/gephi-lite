import { ColorSpace } from "iwanthue";
import type { PrecomputedPalette } from "iwanthue/precomputed";
import defaultPalette from "iwanthue/precomputed/force-vector";
import fancyDarkPalette from "iwanthue/precomputed/force-vector-fancy-dark";
import pastelPalette from "iwanthue/precomputed/force-vector-pastel";
import pimpPalette from "iwanthue/precomputed/force-vector-pimp";
import tarnishPalette from "iwanthue/precomputed/force-vector-tarnish";

export const defaultPalettes: {
  name: ColorSpace;
  precomputed: PrecomputedPalette;
}[] = [
  {
    name: "pastel",
    precomputed: pastelPalette,
  },
  {
    name: "pimp",
    precomputed: pimpPalette,
  },
  {
    name: "tarnish",
    precomputed: tarnishPalette,
  },
  {
    name: "fancy-dark",
    precomputed: fancyDarkPalette,
  },
  {
    name: "default",
    precomputed: defaultPalette,
  },
];
