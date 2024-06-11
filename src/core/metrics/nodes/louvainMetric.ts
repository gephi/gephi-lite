import louvain from "graphology-communities-louvain";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";
import { qualitativeOnly } from "../utils";

export const louvainMetric: Metric<"nodes", ["modularityClass"]> = {
  id: "louvain",
  description: true,
  itemType: "nodes",
  outputs: { modularityClass: qualitativeOnly },
  parameters: [
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: "quantitative",
      description: true,
    },
    {
      id: "fastLocalMoves",
      type: "boolean",
      defaultValue: true,
      description: true,
    },
    {
      id: "randomWalk",
      type: "boolean",
      defaultValue: true,
      description: true,
    },
    {
      id: "resolution",
      type: "number",
      defaultValue: 1,
      description: true,
    },
  ],
  fn(
    parameters: {
      getEdgeWeight?: keyof EdgeRenderingData;
      fastLocalMoves?: boolean;
      randomWalk?: boolean;
      resolution?: number;
    },
    graph: FullGraph,
  ) {
    return { modularityClass: louvain(graph, { ...parameters, getEdgeWeight: parameters.getEdgeWeight || null }) };
  },
};
