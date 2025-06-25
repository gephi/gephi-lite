import { toNumber } from "lodash";

import { EdgeRenderingData, FullGraph } from "../../graph/types";
import { Metric } from "../types";

export const degreeMetric: Metric<{ nodes: ["degree"] }> = {
  id: "degree",
  description: false,
  outputs: {
    nodes: {
      degree: { type: "number" },
    },
  },
  parameters: [
    {
      id: "kind",
      type: "enum",
      values: [{ id: "degree" }, { id: "inDegree" }, { id: "outDegree" }],
      defaultValue: "degree",
    },
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: ["number"],
    },
  ],
  fn(
    {
      kind,
      getEdgeWeight,
    }: {
      kind?: "degree" | "inDegree" | "outDegree";
      getEdgeWeight?: keyof EdgeRenderingData;
    },
    graph: FullGraph,
  ) {
    const collection: Record<string, number> = {};

    if (getEdgeWeight) {
      const reduceEdges = (
        kind === "inDegree" ? graph.reduceInEdges : kind === "outDegree" ? graph.reduceOutEdges : graph.reduceEdges
      ).bind(graph);
      graph.forEachNode((node) => {
        collection[node] = reduceEdges(node, (acc, _edge, attr) => acc + (toNumber(attr[getEdgeWeight]) || 0), 0);
      });
    } else {
      const getDegree = graph[kind || "degree"].bind(graph);
      graph.forEachNode((node) => {
        collection[node] = getDegree(node);
      });
    }

    return {
      nodes: {
        degree: collection,
      },
    };
  },
};
