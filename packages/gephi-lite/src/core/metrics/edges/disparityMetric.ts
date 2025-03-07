import { disparity } from "graphology-metrics/edge";
import { toSimple } from "graphology-operators";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";
import { quantitativeOnly } from "../utils";

export const disparityMetric: Metric<{ edges: ["disparity"] }> = {
  id: "disparity",
  outputs: { edges: { disparity: quantitativeOnly } },
  parameters: [
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: "quantitative",
    },
  ],
  fn(
    parameters: {
      getEdgeWeight?: keyof EdgeRenderingData;
    },
    graph: FullGraph,
  ) {
    return { edges: { disparity: disparity(toSimple(graph), parameters) } };
  },
};
