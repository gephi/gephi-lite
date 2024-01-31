import { Attributes } from "graphology-types";
import { isNil, last, mapValues, omit } from "lodash";
import { Coordinates } from "sigma/types";

import { appearanceAtom } from "../appearance";
import { applyVisualProperties, getAllVisualGetters } from "../appearance/utils";
import { filtersAtom } from "../filters";
import { FilteredGraph } from "../filters/types";
import { applyFilters } from "../filters/utils";
import { itemsRemove, searchActions, searchAtom } from "../search";
import { SearchState } from "../search/types";
import { selectionAtom } from "../selection";
import { SelectionState } from "../selection/types";
import { ItemType } from "../types";
import { atom, derivedAtom } from "../utils/atoms";
import { MultiProducer, Producer, multiproducerToAction, producerToAction } from "../utils/producers";
import { FieldModel, GraphDataset, SigmaGraph } from "./types";
import {
  cleanEdge,
  cleanNode,
  dataGraphToSigmaGraph,
  getEmptyGraphDataset,
  newItemModel,
  serializeDataset,
} from "./utils";

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
  return (state) => {
    const prevState = state[key];
    // todo: remove typescript issue solved here by forcing type
    const update = !!(prevState as { id: string }[]).find((f) => f.id === fieldModel.id);
    return {
      ...state,
      [key]: update
        ? prevState.map((field) => (field.id === fieldModel.id ? fieldModel : field))
        : [...prevState, fieldModel],
    };
  };
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

const deleteItems: MultiProducer<[SearchState, SelectionState, GraphDataset], [ItemType, string[]]> = (type, ids) => {
  return [
    itemsRemove(type, ids),
    (selection) => {
      if (selection.type === type) {
        const newItems = new Set(selection.items);
        ids.forEach((id) => {
          if (newItems.has(id)) newItems.delete(id);
        });
        return {
          ...selection,
          items: newItems,
        };
      }

      return selection;
    },
    (state) => {
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
    },
  ];
};
const deleteItemsAttribute: Producer<GraphDataset, [ItemType, string]> = (type, attributeId) => {
  return (state) => {
    const dataLabel = type === "nodes" ? "nodeData" : "edgeData";
    const fieldsModelLabel = type === "nodes" ? "nodeFields" : "edgeFields";
    return {
      ...state,
      // remove attribute from all items in dataset
      [dataLabel]: mapValues(state[dataLabel], (attributes) => omit(attributes, [attributeId])),
      // remove the attribute fieldModel
      [fieldsModelLabel]: state[fieldsModelLabel].filter((fm) => fm.id !== attributeId),
    };
  };
};
const createNode: Producer<GraphDataset, [string, Attributes]> = (node, attributes) => {
  return (state) => {
    const { data, renderingData } = cleanNode(node, attributes);
    state.fullGraph.addNode(node, {});
    const newNodeFieldModel = newItemModel<"nodes">("nodes", data, state.nodeFields);
    return {
      ...state,
      nodeFields: newNodeFieldModel,
      nodeData: { ...state.nodeData, [node]: data },
      nodeRenderingData: { ...state.nodeRenderingData, [node]: renderingData },
    };
  };
};
const createEdge: Producer<GraphDataset, [string, Attributes, string, string]> = (edge, attributes, source, target) => {
  return (state) => {
    const { data, renderingData } = cleanEdge(edge, attributes);
    state.fullGraph.addEdgeWithKey(edge, source, target, {});
    const newEdgeFieldModel = newItemModel<"edges">("edges", data, state.edgeFields);
    return {
      ...state,
      edgeFields: newEdgeFieldModel,
      edgeData: { ...state.edgeData, [edge]: data },
      edgeRenderingData: { ...state.edgeRenderingData, [edge]: renderingData },
    };
  };
};
const updateNode: Producer<GraphDataset, [string, Attributes]> = (node, attributes) => {
  return (state) => {
    const { data, renderingData } = cleanNode(node, attributes);
    const newNodeFieldModel = newItemModel<"nodes">("nodes", data, state.nodeFields);
    return {
      ...state,
      nodeFields: newNodeFieldModel,
      nodeData: { ...state.nodeData, [node]: data },
      nodeRenderingData: { ...state.nodeRenderingData, [node]: renderingData },
    };
  };
};
const updateEdge: Producer<GraphDataset, [string, Attributes]> = (edge, attributes) => {
  return (state) => {
    const { data, renderingData } = cleanEdge(edge, attributes);
    const newEdgeFieldModel = newItemModel<"edges">("edges", data, state.edgeFields);
    return {
      ...state,
      edgeFields: newEdgeFieldModel,
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
      graph.clear();
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
  createNode: producerToAction(createNode, graphDatasetAtom),
  createEdge: producerToAction(createEdge, graphDatasetAtom),
  updateNode: producerToAction(updateNode, graphDatasetAtom),
  updateEdge: producerToAction(updateEdge, graphDatasetAtom),
  deleteItemsAttribute: producerToAction(deleteItemsAttribute, graphDatasetAtom),
  deleteItems: multiproducerToAction(deleteItems, [searchAtom, selectionAtom, graphDatasetAtom]),
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

  // When graph data or fields changed, we reindex it for the search
  if (updatedKeys.has("fullGraph") || updatedKeys.has("edgeFields") || updatedKeys.has("nodeFields")) {
    searchActions.indexAll();
  }

  // When graph meta change, we set the page metadata
  if (updatedKeys.has("metadata")) {
    document.title = ["Gephi Lite", graphDataset.metadata.title].filter((s) => !isNil(s)).join(" - ");
  }

  // Only "small enough" graphs are stored in the sessionStorage, because this
  // feature only helps to resist page reloads, basically:
  if (graphDataset.fullGraph.order < 5000 && graphDataset.fullGraph.size < 25000) {
    try {
      sessionStorage.setItem("dataset", serializeDataset(graphDataset));
    } catch (_e) {
      // nothing todo
    }
  }
});

filtersAtom.bind((filtersState) => {
  const cache = filteredGraphsAtom.get();
  const dataset = graphDatasetAtom.get();

  const newCache = applyFilters(dataset, filtersState.past, cache);
  filteredGraphsAtom.set(newCache);
});
