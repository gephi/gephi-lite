import random, { RandomLayoutOptions } from "graphology-layout/random";

import { LayoutMapping, OneShotLayout } from "../types";

export const RandomLayout = {
  id: "random",
  type: "oneshot",
  description: true,
  parameters: [
    {
      id: "center",
      type: "number",
      description: true,
      defaultValue: 0.5,
    },
    {
      id: "scale",
      type: "number",
      description: true,
      defaultValue: 1000,
      min: 0,
      minExcluded: true,
    },
  ],
  run: (graph, options) => random(graph, options?.settings) as unknown as LayoutMapping,
} as OneShotLayout<RandomLayoutOptions>;
