import { hits } from "graphology-metrics/centrality";
import { toSimple } from "graphology-operators";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";

export const hitsMetric: Metric<{ nodes: ["hubs", "authorities"] }> = {
  id: "hits",
  outputs: { nodes: { hubs: { type: "number" }, authorities: { type: "number" } } },
  parameters: [
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: ["number"],
    },
    {
      id: "maxIterations",
      type: "number",
      defaultValue: 100,
    },
    {
      id: "tolerance",
      type: "number",
      defaultValue: 1e-8,
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
      maxIterations?: number;
      normalize?: boolean;
      tolerance?: number;
    },
    graph: FullGraph,
  ) {
    return { nodes: hits(toSimple(graph), parameters) };
  },
};
