import { chiSquare } from "graphology-metrics/edge";

import { type EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";

export const chiSquareMetric: Metric<{ edges: ["chiSquareStrength"] }> = {
  id: "chiSquare",
  outputs: { edges: { chiSquareStrength: { type: "number" } } },
  parameters: [
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: ["number"],
    },
  ],
  fn(
    parameters: {
      getEdgeWeight?: keyof EdgeRenderingData;
    },
    graph: FullGraph,
  ) {
    console.log(chiSquare(graph, parameters.getEdgeWeight));
    return { edges: { chiSquareStrength: chiSquare(graph, parameters.getEdgeWeight) } };
  },
};
