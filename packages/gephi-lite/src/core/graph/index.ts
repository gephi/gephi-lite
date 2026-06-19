import {
  AppearanceState,
  FilteredGraph,
  FiltersState,
  Scalar,
  getEmptyAppearanceState,
} from "@gephi/gephi-lite-sdk";
import {
  MultiProducer,
  Producer,
  atom,
  derivedAtom,
  multiProducerToAction,
  producerToAction,
  useReadAtom,
} from "@ouestware/atoms";
import { Attributes } from "graphology-types";
import { isNil, keyBy, last, map, mapValues, omit } from "lodash";
import { Coordinates } from "sigma/types";

import { appearanceAtom } from "../appearance";
import { applyVisualProperties, getAllVisualGetters } from "../appearance/utils";
import { useGraphDataset } from "../context/dataContexts";
import { EVENTS, emitter } from "../context/eventsContext";
import { filtersAtom } from "../filters";
import { buildTopologicalFiltersDefinitions } from "../filters/topological";
import { FilterType } from "../filters/types";
import { applyFilters, getEmptyFiltersState } from "../filters/utils";
import { edgeIndex, itemsIndex, itemsRemove, nodeIndex, searchActions, searchAtom } from "../search";
import { SearchState } from "../search/types";
import { selectionAtom } from "../selection";
import { SelectionState } from "../selection/types";
import { getEmptySelectionState } from "../selection/utils";
import { ItemType } from "../types";
import { syncAppearanceStateWithGraphFields } from "./appearanceSync";
import { DYNAMIC_ATTRIBUTES, computeAllDynamicAttributes } from "./dynamicAttributes";
import {
  createFieldModel,
  deleteFieldModel,
  duplicateFieldModel,
  moveFieldModel,
  setFieldModel,
} from "./fieldModelProducers";
import { setGraphType } from "./graphTypeTransform";
import { GraphDataset, SigmaGraph } from "./types";
import {
  cleanEdge,
  cleanNode,
  dataGraphToSigmaGraph,
  datasetToString,
  getEmptyGraphDataset,
  newItemModel,
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
const setNodePositions: Producer<GraphDataset, [Record<string, Coordinates>]> = (positions) => {
  return (state) => ({
    ...state,
    layout: mapValues(state.layout, (data, id) => ({
      ...data,
      ...(positions[id] || {}),
    })),
  });
};

const deleteItems: MultiProducer<[SelectionState, GraphDataset, SearchState], [ItemType, string[]]> = (type, ids) => {
  return [
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
          layout: omit(state.layout, ids),
        };
      } else {
        ids.forEach((id) => state.fullGraph.dropEdge(id));
        return {
          ...state,
          edgeData: omit(state.edgeData, ids),
        };
      }
    },
    itemsRemove(type, ids),
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
const createNode: MultiProducer<[GraphDataset, SearchState], [string, Attributes]> = (node, attributes) => {
  return [
    (state) => {
      const { data, position } = cleanNode(node, attributes);
      state.fullGraph.addNode(node);
      const newNodeFieldModel = newItemModel<"nodes">("nodes", data, state.nodeFields);
      return {
        ...state,
        nodeFields: newNodeFieldModel,
        nodeData: { ...state.nodeData, [node]: data },
        layout: { ...state.layout, [node]: position },
      };
    },
    nodeIndex(node),
  ];
};

const createEdge: MultiProducer<[GraphDataset, SearchState], [string, Attributes, string, string, boolean]> = (
  edge,
  attributes,
  source,
  target,
  directed,
) => {
  return [
    (state) => {
      const { data } = cleanEdge(edge, attributes);
      const graphType = state.fullGraph.type;
      if (graphType === "directed" || (graphType === "mixed" && directed)) {
        state.fullGraph.addDirectedEdgeWithKey(edge, source, target);
      } else {
        state.fullGraph.addUndirectedEdgeWithKey(edge, source, target);
      }

      const newEdgeFieldModel = newItemModel<"edges">("edges", data, state.edgeFields);

      // Index the edge
      searchActions.edgeIndex(edge);
      return {
        ...state,
        edgeFields: newEdgeFieldModel,
        edgeData: { ...state.edgeData, [edge]: data },
      };
    },
    edgeIndex(edge),
  ];
};
const updateNode: MultiProducer<[GraphDataset, SearchState], [string, Attributes, { merge?: boolean }?]> = (
  node,
  attributes,
  { merge } = {},
) => {
  return [
    (state) => {
      const { data, position } = cleanNode(node, merge ? { ...state.nodeData[node], ...attributes } : attributes);
      const newNodeFieldModel = newItemModel<"nodes">("nodes", data, state.nodeFields);
      return {
        ...state,
        nodeFields: newNodeFieldModel,
        nodeData: { ...state.nodeData, [node]: data },
        layout: { ...state.layout, [node]: position },
      };
    },
    nodeIndex(node),
  ];
};
const updateEdge: MultiProducer<
  [GraphDataset, SearchState],
  [string, Attributes, { merge?: boolean; directed?: boolean }?]
> = (edge, attributes, { merge, directed } = {}) => {
  return [
    (state) => {
      const { data } = cleanEdge(edge, merge ? { ...state.edgeData[edge], ...attributes } : attributes);
      const newEdgeFieldModel = newItemModel<"edges">("edges", data, state.edgeFields);

      // Validate new edge direction:
      let fullGraph = state.fullGraph;
      const graphType = fullGraph.type;
      const newDirected = graphType === "mixed" ? directed : graphType === "directed";

      if (!isNil(newDirected) && fullGraph.isDirected(edge) !== directed) {
        const newFullGraph = fullGraph.emptyCopy();
        fullGraph.forEachEdge((e, _, source, target) => {
          const isEdgeDirected = e === edge ? newDirected : fullGraph.isDirected(e);
          if (isEdgeDirected) {
            newFullGraph.addDirectedEdgeWithKey(e, source, target);
          } else {
            newFullGraph.addUndirectedEdgeWithKey(e, source, target);
          }
        });
        fullGraph = newFullGraph;
      }

      // Index the edge
      searchActions.edgeIndex(edge);
      return {
        ...state,
        fullGraph,
        edgeFields: newEdgeFieldModel,
        edgeData: { ...state.edgeData, [edge]: data },
      };
    },
    edgeIndex(edge),
  ];
};
const updateItems: MultiProducer<[GraphDataset, SearchState], [ItemType, Set<string>, string, Scalar]> = (
  type,
  itemIds,
  fieldId,
  value,
) => {
  return [
    (state) => {
      const fields = keyBy(type === "nodes" ? state.nodeFields : state.edgeFields, "id");
      if (!fields[fieldId]) throw new Error(`The field ${fieldId} does not exist for ${type} in the current dataset.`);

      const dataKey = type === "nodes" ? "nodeData" : "edgeData";
      const data = state[dataKey];
      const updatedItems = Array.from(itemIds).reduce((acc, itemId) => {
        if (!data[itemId]) throw new Error(`The ${type} collection does not have any item with "${itemId}" id.`);
        return { ...acc, [itemId]: { ...data[itemId], [fieldId]: value } };
      }, {});

      return {
        ...state,
        [dataKey]: {
          ...data,
          ...updatedItems,
        },
      };
    },
    itemsIndex(type, Array.from(itemIds)),
  ];
};

const resetGraph: MultiProducer<[FiltersState, AppearanceState, SelectionState, GraphDataset]> = () => {
  return [
    () => getEmptyFiltersState(),
    () => getEmptyAppearanceState(),
    () => getEmptySelectionState(),
    () => getEmptyGraphDataset(),
  ];
};

/**
 * Public API:
 * ***********
 */
export const graphDatasetAtom = atom<GraphDataset>(getEmptyGraphDataset());
export const filteredGraphsAtom = atom<FilteredGraph[]>([]);
export const filteredGraphAtom = derivedAtom(
  [filteredGraphsAtom, graphDatasetAtom],
  (filteredGraphCache, graphDataset) => last(filteredGraphCache)?.graph || graphDataset.fullGraph,
  { checkInput: false },
);
export const useFilteredGraphAt = (index: number) => {
  const graphDataset = useGraphDataset();
  const filteredGraphs = useReadAtom(filteredGraphsAtom);
  return filteredGraphs[index]?.graph || graphDataset.fullGraph;
};
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

export const graphDatasetActions = {
  // Meta:
  setGraphMeta: producerToAction(setGraphMeta, graphDatasetAtom),
  editGraphMeta: producerToAction(editGraphMeta, graphDatasetAtom),
  setGraphType: producerToAction(setGraphType, graphDatasetAtom),

  // Graph model:
  setFieldModel: producerToAction(setFieldModel, graphDatasetAtom),
  moveFieldModel: producerToAction(moveFieldModel, graphDatasetAtom),
  createFieldModel: producerToAction(createFieldModel, graphDatasetAtom),
  deleteFieldModel: producerToAction(deleteFieldModel, graphDatasetAtom),
  duplicateFieldModel: producerToAction(duplicateFieldModel, graphDatasetAtom),

  // Graph items:
  createNode: multiProducerToAction(createNode, [graphDatasetAtom, searchAtom]),
  createEdge: multiProducerToAction(createEdge, [graphDatasetAtom, searchAtom]),
  updateNode: multiProducerToAction(updateNode, [graphDatasetAtom, searchAtom]),
  updateEdge: multiProducerToAction(updateEdge, [graphDatasetAtom, searchAtom]),
  updateItems: multiProducerToAction(updateItems, [graphDatasetAtom, searchAtom]),
  deleteItems: multiProducerToAction(deleteItems, [selectionAtom, graphDatasetAtom, searchAtom]),
  deleteItemsAttribute: producerToAction(deleteItemsAttribute, graphDatasetAtom),

  // Larger actions:
  setGraphDataset: producerToAction(setGraphDataset, graphDatasetAtom),
  setNodePositions: producerToAction(setNodePositions, graphDatasetAtom),
  resetGraph: multiProducerToAction(resetGraph, [filtersAtom, appearanceAtom, selectionAtom, graphDatasetAtom]),
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
  if (updatedKeys.has("fullGraph") || updatedKeys.has("layout")) {
    const filtersState = filtersAtom.get();
    const newCache = applyFilters(graphDataset, filtersState.filters, [], topologicalFiltersAtom.get());
    filteredGraphsAtom.set(newCache);
  }

  // When graph data or fields changed, we reindex it for the search
  if (updatedKeys.has("fullGraph") || updatedKeys.has("edgeFields") || updatedKeys.has("nodeFields")) {
    searchActions.indexAll();
  }

  // When fields changed, check if filter or appearance use it
  // here we test only static field
  if (updatedKeys.has("edgeFields") || updatedKeys.has("nodeFields")) {
    const nodeFields = graphDataset.nodeFields.map((nf) => nf.id);
    const edgeFields = graphDataset.edgeFields.map((nf) => nf.id);

    // filters
    const filtersState = filtersAtom.get();
    const filterFilters = (f: FilterType) =>
      // here we test only static field
      !("field" in f) || f.field === undefined || nodeFields.includes(f.field.id) || edgeFields.includes(f.field.id);
    filtersAtom.set({
      filters: filtersState.filters.filter(filterFilters),
    });
    // appearance
    appearanceAtom.set(syncAppearanceStateWithGraphFields(graphDataset, appearanceAtom.get()));
  }

  // Only "small enough" graphs are stored in the sessionStorage, because this
  // feature only helps to resist page reloads, basically:
  if (graphDataset.fullGraph.order < 5000 && graphDataset.fullGraph.size < 25000) {
    try {
      sessionStorage.setItem("dataset", datasetToString(graphDataset));
    } catch (_e) {
      // nothing todo
    }
  }
});

filtersAtom.bind((filtersState) => {
  // TODO: Restore cache management when disabling/enabling filters:
  // const cache = filteredGraphsAtom.get();
  const cache: FilteredGraph[] = [];
  const dataset = graphDatasetAtom.get();

  const newCache = applyFilters(dataset, filtersState.filters, cache, topologicalFiltersAtom.get());
  filteredGraphsAtom.set(newCache);
});
