import { last, mapValues, isNil, omit } from "lodash";
import { Coordinates } from "sigma/types";
import { Attributes } from "graphology-types";

import { filtersAtom } from "../filters";
import { appearanceAtom } from "../appearance";
import { searchActions } from "../search";
import { clearGraph } from "../../utils/graph";
import { applyFilters } from "../filters/utils";
import { FilteredGraph } from "../filters/types";
import { atom, derivedAtom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/reducers";
import { FieldModel, GraphDataset, SigmaGraph } from "./types";
import { applyVisualProperties, getAllVisualGetters } from "../appearance/utils";
import { cleanEdge, cleanNode, dataGraphToSigmaGraph, getEmptyGraphDataset, serializeDataset } from "./utils";
import { ItemType } from "../types";

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
const editGraphMeta: Producer<GraphDataset, [Partial<GraphDataset["metadata"]>]> = (metadata) => {
  return (state) => ({
    ...state,
    metadata: { ...state.metadata, ...metadata },
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

const deleteItems: Producer<GraphDataset, [ItemType, string[]]> = (type, ids) => {
  return (state) => {
    if (type === "nodes") {
      ids.forEach((id) => state.fullGraph.dropNode(id));
      return {
        ...state,
        nodeData: omit(state.nodeData, ids),
        nodeRenderingData: omit(state.nodeRenderingData, ids),
      };
    } else {
      ids.forEach((id) => state.fullGraph.dropEdge(id));
      return {
        ...state,
        edgeData: omit(state.edgeData, ids),
        edgeRenderingData: omit(state.edgeRenderingData, ids),
      };
    }
  };
};
const createNode: Producer<GraphDataset, [string, Attributes]> = (node, attributes) => {
  return (state) => {
    const { data, renderingData } = cleanNode(node, attributes);
    state.fullGraph.addNode(node, {});
    return {
      ...state,
      nodeData: { ...state.nodeData, [node]: data },
      nodeRenderingData: { ...state.nodeRenderingData, [node]: renderingData },
    };
  };
};
const createEdge: Producer<GraphDataset, [string, Attributes, string, string]> = (edge, attributes, source, target) => {
  return (state) => {
    const { data, renderingData } = cleanEdge(edge, attributes);
    state.fullGraph.addEdgeWithKey(edge, source, target, {});
    return {
      ...state,
      edgeData: { ...state.edgeData, [edge]: data },
      edgeRenderingData: { ...state.edgeRenderingData, [edge]: renderingData },
    };
  };
};
const updateNode: Producer<GraphDataset, [string, Attributes]> = (node, attributes) => {
  return (state) => {
    const { data, renderingData } = cleanNode(node, attributes);
    return {
      ...state,
      nodeData: { ...state.nodeData, [node]: data },
      nodeRenderingData: { ...state.nodeRenderingData, [node]: renderingData },
    };
  };
};
const updateEdge: Producer<GraphDataset, [string, Attributes]> = (edge, attributes) => {
  return (state) => {
    const { data, renderingData } = cleanEdge(edge, attributes);
    return {
      ...state,
      edgeData: { ...state.edgeData, [edge]: data },
      edgeRenderingData: { ...state.edgeRenderingData, [edge]: renderingData },
    };
  };
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
  deleteItems: producerToAction(deleteItems, graphDatasetAtom),
  createNode: producerToAction(createNode, graphDatasetAtom),
  createEdge: producerToAction(createEdge, graphDatasetAtom),
  updateNode: producerToAction(updateNode, graphDatasetAtom),
  updateEdge: producerToAction(updateEdge, graphDatasetAtom),
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

  // When graph data or fields changed changed, we reindex it for the search
  if (updatedKeys.has("fullGraph") || updatedKeys.has("edgeFields") || updatedKeys.has("nodeFields")) {
    searchActions.indexAll();
  }

  // When graph meta change, we set the page meta data
  if (updatedKeys.has("metadata")) {
    document.title = ["Gephi Lite", graphDataset.metadata.title].filter((s) => !isNil(s)).join(" - ");
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
