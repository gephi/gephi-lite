import { getEmptyAppearanceState, getEmptyFiltersState } from "@gephi/gephi-lite-sdk";
import type {
  AppearanceState,
  FiltersState,
  ItemData,
  NodeCoordinates,
  SerializedGraphDataset,
} from "@gephi/gephi-lite-sdk";
import type Graph from "graphology-types";

interface GephiLiteWorkspace {
  type: string;
  version: string;
  graphDataset: SerializedGraphDataset;
  filters: FiltersState;
  appearance: Partial<AppearanceState>;
}

export function workspaceFromGraph(graph: Graph): GephiLiteWorkspace {
  const nodeData: Record<string, ItemData> = {};
  const edgeData: Record<string, ItemData> = {};
  const layout: Record<string, NodeCoordinates> = {};

  graph.forEachNode((key, attributes) => {
    nodeData[key] = attributes;
    layout[key] = { x: Math.random(), y: Math.random() };
  });

  graph.forEachEdge((key, attributes) => {
    edgeData[key] = attributes;
  });

  const nodes = graph.mapNodes((key) => {
    return { key };
  });

  const edges = graph.mapEdges((key, _, source, target) => {
    return { key, source, target };
  });

  const workspace: GephiLiteWorkspace = {
    type: "gephi-lite",
    version: "1.0.1",
    graphDataset: {
      metadata: {},
      nodeData,
      edgeData,
      edgeFields: [],
      nodeFields: [],
      layout,
      fullGraph: {
        attributes: graph.getAttributes(),
        options: {
          type: graph.type,
          multi: graph.multi,
          allowSelfLoops: graph.allowSelfLoops,
        },
        nodes,
        edges,
      },
    },
    filters: getEmptyFiltersState(),
    appearance: getEmptyAppearanceState(),
  };

  return workspace;
}
