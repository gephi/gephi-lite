import { disparity } from "graphology-metrics/edge";
import { toSimple } from "graphology-operators";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";
import { quantitativeOnly } from "../utils";

export const disparityMetric: Metric<"edges", ["disparity"]> = {
  id: "disparity",
  itemType: "edges",
  outputs: { disparity: quantitativeOnly },
  parameters: [
    {
      id: "getEdgeWeight",
      labelKey: "edges.disparity.parameters.getEdgeWeight.title",
      type: "field",
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
    return { disparity: disparity(toSimple(graph), parameters) };
  },
};
