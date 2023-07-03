import { last, mapValues, omit } from "lodash";
import { Coordinates } from "sigma/types";

import { filtersAtom } from "../filters";
import { appearanceAtom } from "../appearance";
import { clearGraph } from "../../utils/graph";
import { applyFilters } from "../filters/utils";
import { FilteredGraph } from "../filters/types";
import { atom, derivedAtom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/reducers";
import { FieldModel, GraphDataset, SigmaGraph } from "./types";
import { applyVisualProperties, getAllVisualGetters } from "../appearance/utils";
import { dataGraphToSigmaGraph, getEmptyGraphDataset, serializeDataset } from "./utils";

/**
 * Producers:
 * **********
 */
const setGraphDataset: Producer<GraphDataset, [GraphDataset]> = (dataset) => {
  return () => dataset;
};
const setGraphMeta: Producer<GraphDataset, [GraphDataset["metadata"]]> = (metadata) => {
  return (state) => ({
    ...state,
    metadata,
  });
};
const editGraphMeta: Producer<GraphDataset, [string, any]> = (key, value) => {
  return (state) => ({
    ...state,
    metadata: value === undefined ? omit(state.metadata, key) : { ...state.metadata, [key]: value },
  });
};
const setFieldModel: Producer<GraphDataset, [FieldModel]> = (fieldModel) => {
  const key = fieldModel.itemType === "nodes" ? "nodeFields" : "edgeFields";

  return (state) => ({
    ...state,
    [key]: state[key].map((field) => (field.id === fieldModel.id ? fieldModel : field)),
  });
};
const setNodePositions: Producer<GraphDataset, [Record<string, Coordinates>]> = (positions) => {
  return (state) => ({
    ...state,
    nodeRenderingData: mapValues(state.nodeRenderingData, (data, id) => ({
      ...data,
      ...(positions[id] || {}),
    })),
  });
};

/**
 * Public API:
 * ***********
 */
export const graphDatasetAtom = atom<GraphDataset>(getEmptyGraphDataset());
export const filteredGraphsAtom = atom<FilteredGraph[]>([]);
export const filteredGraphAtom = derivedAtom(
  [graphDatasetAtom, filteredGraphsAtom],
  (graphDataset, filteredGraphCache) => {
    return last(filteredGraphCache)?.graph || graphDataset.fullGraph;
  },
);
export const parentFilteredGraphAtom = derivedAtom(
  [graphDatasetAtom, filteredGraphsAtom],
  (graphDataset, filteredGraphCache) => {
    return filteredGraphCache[filteredGraphCache.length - 2]?.graph || graphDataset.fullGraph;
  },
);
export const visualGettersAtom = derivedAtom([graphDatasetAtom, appearanceAtom], getAllVisualGetters);
export const sigmaGraphAtom = derivedAtom(
  [graphDatasetAtom, filteredGraphAtom, visualGettersAtom],
  (dataset, filteredGraph, visualGetters, graph: SigmaGraph | undefined) => {
    const newGraph = dataGraphToSigmaGraph(dataset, filteredGraph);
    applyVisualProperties(newGraph, dataset, visualGetters);

    if (graph) {
      clearGraph(graph);
      graph.import(newGraph);

      return graph;
    }

    return newGraph;
  },
  { debounce: true },
);

export const graphDatasetActions = {
  setGraphMeta: producerToAction(setGraphMeta, graphDatasetAtom),
  editGraphMeta: producerToAction(editGraphMeta, graphDatasetAtom),
  setFieldModel: producerToAction(setFieldModel, graphDatasetAtom),
  setGraphDataset: producerToAction(setGraphDataset, graphDatasetAtom),
  setNodePositions: producerToAction(setNodePositions, graphDatasetAtom),
};

/**
 * Bindings:
 * *********
 */
graphDatasetAtom.bind((graphDataset, previousGraphDataset) => {
  const updatedKeys = new Set(
    (Object.keys(graphDataset) as (keyof GraphDataset)[]).filter(
      (key) => graphDataset[key] !== previousGraphDataset[key],
    ),
  );

  // When the fullGraph ref changes, reindex everything:
  if (updatedKeys.has("fullGraph") || updatedKeys.has("nodeRenderingData") || updatedKeys.has("edgeRenderingData")) {
    const filtersState = filtersAtom.get();
    const newCache = applyFilters(graphDataset, filtersState.past, []);
    filteredGraphsAtom.set(newCache);
  }

  // Only "small enough" graphs are stored in the sessionStorage, because this
  // feature only helps resisting page reloads, basically:
  if (graphDataset.fullGraph.order < 5000 && graphDataset.fullGraph.size < 25000) {
    try {
      sessionStorage.setItem("dataset", serializeDataset(graphDataset));
    } catch (_e) {}
  }
});

filtersAtom.bind((filtersState) => {
  const cache = filteredGraphsAtom.get();
  const dataset = graphDatasetAtom.get();

  const newCache = applyFilters(dataset, filtersState.past, cache);
  filteredGraphsAtom.set(newCache);
});
