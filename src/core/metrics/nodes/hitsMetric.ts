import { hits } from "graphology-metrics/centrality";
import { toSimple } from "graphology-operators";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";
import { quantitativeOnly } from "../utils";

export const hitsMetric: Metric<"nodes", ["hubs", "authorities"]> = {
  id: "hits",
  itemType: "nodes",
  outputs: { hubs: quantitativeOnly, authorities: quantitativeOnly },
  parameters: [
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: "quantitative",
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
    return hits(toSimple(graph), parameters);
  },
};
