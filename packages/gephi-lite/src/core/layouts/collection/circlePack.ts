import Graph from "graphology";
import circlepack from "graphology-layout/circlepack";

import { OneShotLayout } from "../types";

export const CirclePackLayout = {
  id: "circlePack",
  type: "oneshot",
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
} as OneShotLayout<{ scale?: number; groupingField?: string; center?: number }>;
