import random, { RandomLayoutOptions } from "graphology-layout/random";

import { LayoutMapping, SyncLayout } from "../types";

export const RandomLayout = {
  id: "random",
  type: "sync",
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
    },
  ],
  run: (graph, options) => random(graph, options?.settings) as unknown as LayoutMapping,
} as SyncLayout<RandomLayoutOptions>;
