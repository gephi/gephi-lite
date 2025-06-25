import { pagerank } from "graphology-metrics/centrality";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";

export const pageRankMetric: Metric<{ nodes: ["pagerank"] }> = {
  id: "pagerank",
  outputs: { nodes: { pagerank: { type: "number" } } },
  parameters: [
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: ["number"],
    },
    {
      id: "alpha",
      type: "number",
      defaultValue: 0.85,
    },
    {
      id: "maxIterations",
      type: "number",
      defaultValue: 100,
      min: 1,
    },
    {
      id: "tolerance",
      type: "number",
      defaultValue: 1e-6,
    },
  ],
  fn(
    parameters: {
      getEdgeWeight?: keyof EdgeRenderingData;
      alpha?: number;
      maxIterations?: number;
      tolerance?: number;
    },
    graph: FullGraph,
  ) {
    return { nodes: { pagerank: pagerank(graph, { ...parameters, getEdgeWeight: parameters.getEdgeWeight || null }) } };
  },
};
