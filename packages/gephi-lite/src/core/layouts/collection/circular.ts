import circular, { CircularLayoutOptions } from "graphology-layout/circular";

import { LayoutMapping, SyncLayout } from "../types";

export const CircularLayout = {
  id: "circular",
  type: "sync",
  description: true,
  parameters: [
    {
      id: "center",
      type: "number",
      description: true,
      defaultValue: 0,
      step: 1,
    },
    {
      id: "scale",
      type: "number",
      description: true,
      defaultValue: 1000,
    },
  ],
  run: (graph, options) => circular(graph, options?.settings) as unknown as LayoutMapping,
} as SyncLayout<CircularLayoutOptions>;
