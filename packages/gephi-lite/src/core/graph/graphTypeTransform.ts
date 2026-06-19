import { type Producer } from "@ouestware/atoms";
import { MultiGraph } from "graphology";
import { type GraphType } from "graphology-types";

import { type DatalessGraph, type GraphDataset } from "./types";

const GRAPH_TRANSFORMATION_METHODS: Record<GraphType, (graph: DatalessGraph) => DatalessGraph> = {
  mixed: (graph) => {
    const result = new MultiGraph({ type: "mixed" });
    graph.forEachNode((node) => result.addNode(node));
    graph.forEachEdge((edge, _, source, target) =>
      graph.isDirected(edge)
        ? result.addDirectedEdgeWithKey(edge, source, target)
        : result.addUndirectedEdgeWithKey(edge, source, target),
    );
    return result;
  },
  directed: (graph) => {
    const result = new MultiGraph({ type: "directed" });
    graph.forEachNode((node) => result.addNode(node));
    graph.forEachEdge((edge, _, source, target) => result.addDirectedEdgeWithKey(edge, source, target));
    return result;
  },
  undirected: (graph) => {
    const result = new MultiGraph({ type: "undirected" });
    graph.forEachNode((node) => result.addNode(node));
    graph.forEachEdge((edge, _, source, target) => result.addUndirectedEdgeWithKey(edge, source, target));
    return result;
  },
};

export function transformGraphType(graph: DatalessGraph, type: GraphType): DatalessGraph {
  return GRAPH_TRANSFORMATION_METHODS[type](graph);
}

export const setGraphType: Producer<GraphDataset, [GraphType]> = (newType) => {
  return (state) =>
    newType === state.fullGraph.type
      ? state
      : {
          ...state,
          fullGraph: transformGraphType(state.fullGraph, newType),
        };
};
