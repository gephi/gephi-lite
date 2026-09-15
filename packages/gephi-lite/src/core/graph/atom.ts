import { FilteredGraph, GraphDataset, SigmaGraph, getEmptyGraphDataset } from "@gephi/gephi-lite-sdk";
import { atom, derivedAtom } from "@ouestware/atoms";
import { last, map } from "lodash";

import { appearanceAtom } from "../appearance/atom";
import { applyVisualProperties, getAllVisualGetters } from "../appearance/utils";
import { EVENTS, emitter } from "../context/eventsContext";
import { buildTopologicalFiltersDefinitions } from "../filters/topological";
import { DYNAMIC_ATTRIBUTES, computeAllDynamicAttributes } from "./dynamicAttributes";
import { dataGraphToSigmaGraph } from "./utils";

export const graphDatasetAtom = atom<GraphDataset>(getEmptyGraphDataset());

export const filteredGraphsAtom = atom<FilteredGraph[]>([]);

export const filteredGraphAtom = derivedAtom(
  [filteredGraphsAtom, graphDatasetAtom],
  (filteredGraphCache, graphDataset) => last(filteredGraphCache)?.graph || graphDataset.fullGraph,
  { checkInput: false },
);

export const dynamicItemDataAtom = derivedAtom(
  [filteredGraphAtom, graphDatasetAtom],
  (filteredGraphCache) => ({
    dynamicNodeData: computeAllDynamicAttributes("nodes", filteredGraphCache),
    dynamicNodeFields: map(DYNAMIC_ATTRIBUTES.nodes, ({ field }) => field) || [],
    dynamicEdgeData: computeAllDynamicAttributes("edges", filteredGraphCache),
    dynamicEdgeFields: map(DYNAMIC_ATTRIBUTES.edges, ({ field }) => field) || [],
  }),
  { checkInput: false },
);

export const visualGettersAtom = derivedAtom(
  [graphDatasetAtom, dynamicItemDataAtom, appearanceAtom],
  getAllVisualGetters,
  { checkInput: false },
);

export const topologicalFiltersAtom = derivedAtom(graphDatasetAtom, ({ fullGraph }) => {
  return buildTopologicalFiltersDefinitions(fullGraph);
});

export const sigmaGraphAtom = derivedAtom(
  [graphDatasetAtom, filteredGraphAtom, visualGettersAtom],
  (dataset, filteredGraph, visualGetters, graph: SigmaGraph | undefined) => {
    const dynamicItemData = dynamicItemDataAtom.get();
    const newGraph = dataGraphToSigmaGraph(dataset, filteredGraph);
    applyVisualProperties(newGraph, dataset, dynamicItemData, visualGetters);

    if (graph) {
      graph.clear();
      graph.import(newGraph);
      emitter.emit(EVENTS.graphImported);

      return graph;
    }

    return newGraph;
  },
  { debounce: true, checkInput: false },
);
