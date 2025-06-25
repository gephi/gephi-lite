import betweennessCentrality from "graphology-metrics/centrality/betweenness";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";

export const betweennessCentralityMetric: Metric<{ nodes: ["betweennessCentrality"] }> = {
  id: "betweennessCentrality",
  outputs: {
    nodes: {
      betweennessCentrality: { type: "number" },
    },
  },
  parameters: [
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: ["number"],
    },
    {
      id: "normalize",
      type: "boolean",
      defaultValue: true,
    },
  ],
  fn(
    parameters: {
      getEdgeWeight?: keyof EdgeRenderingData;
      normalize?: boolean;
    },
    graph: FullGraph,
  ) {
    return {
      nodes: {
        betweennessCentrality: betweennessCentrality(graph, {
          ...parameters,
          getEdgeWeight: parameters.getEdgeWeight || null,
          normalized: parameters.normalize,
        }),
      },
    };
  },
};
