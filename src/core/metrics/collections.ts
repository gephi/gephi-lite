import { hits, pagerank } from "graphology-metrics/centrality";
import betweennessCentrality from "graphology-metrics/centrality/betweenness";
import { disparity, simmelianStrength } from "graphology-metrics/edge";

import { Metric } from "./types";
import { DataGraph, EdgeRenderingData } from "../graph/types";

export const NODE_METRICS: Metric<"nodes", any, any>[] = [
  {
    id: "pagerank",
    types: { score: "number" },
    itemType: "nodes",
    parameters: [
      {
        id: "getEdgeWeight",
        type: "attribute",
        itemType: "edges",
        restriction: "quantitative",
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
    metric(
      parameters: {
        getEdgeWeight?: keyof EdgeRenderingData;
        alpha?: number;
        maxIterations?: number;
        tolerance?: number;
      },
      graph: DataGraph,
    ) {
      return { score: pagerank(graph, { ...parameters, getEdgeWeight: parameters.getEdgeWeight || null }) };
    },
  },
  {
    id: "betweennessCentrality",
    types: { score: "number" },
    itemType: "nodes",
    parameters: [
      {
        id: "getEdgeWeight",
        type: "attribute",
        itemType: "edges",
        restriction: "quantitative",
      },
      {
        id: "normalize",
        type: "boolean",
        defaultValue: true,
      },
    ],
    metric(
      parameters: {
        getEdgeWeight?: keyof EdgeRenderingData;
        normalize?: boolean;
      },
      graph: DataGraph,
    ) {
      return {
        score: betweennessCentrality(graph, {
          ...parameters,
          getEdgeWeight: parameters.getEdgeWeight || null,
          normalized: parameters.normalize,
        }),
      };
    },
  },
  {
    id: "hits",
    types: { authorities: "number", hubs: "number" },
    itemType: "nodes",
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
    metric(
      parameters: {
        getEdgeWeight?: keyof EdgeRenderingData;
        maxIterations?: number;
        normalize?: boolean;
        tolerance?: number;
      },
      graph: DataGraph,
    ) {
      return hits(graph, parameters);
    },
  },
];

export const EDGE_METRICS: Metric<"edges", any, any>[] = [
  {
    id: "disparity",
    types: { score: "number" },
    itemType: "edges",
    parameters: [
      {
        id: "getEdgeWeight",
        type: "attribute",
        itemType: "edges",
        restriction: "quantitative",
      },
    ],
    metric(
      parameters: {
        getEdgeWeight?: keyof EdgeRenderingData;
      },
      graph: DataGraph,
    ) {
      return { score: disparity(graph, parameters) };
    },
  },
  {
    id: "simmelianStrength",
    types: { score: "number" },
    itemType: "edges",
    parameters: [],
    metric(parameters: {}, graph: DataGraph) {
      return { score: simmelianStrength(graph) };
    },
  },
];
