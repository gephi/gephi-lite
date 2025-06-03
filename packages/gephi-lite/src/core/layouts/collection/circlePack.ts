import Graph from "graphology";
import circlepack from "graphology-layout/circlepack";

import { SyncLayout } from "../types";

export const CirclePackLayout = {
  id: "circlePack",
  type: "sync",
  description: true,
  parameters: [
    {
      id: "groupingField",
      type: "attribute",
      itemType: "nodes",
      required: false,
    },
    {
      id: "center",
      type: "number",
      description: true,
      defaultValue: 0.5,
      step: 0.1,
    },
    {
      id: "scale",
      type: "number",
      description: true,
      defaultValue: 1,
    },
  ],
  run(graph: Graph, options) {
    const { groupingField, center, scale } = options?.settings || {};

    return circlepack(graph, {
      center,
      scale,
      hierarchyAttributes: groupingField ? [groupingField] : [],
    });
  },
} as SyncLayout<{ scale?: number; groupingField?: string; center?: number }>;
