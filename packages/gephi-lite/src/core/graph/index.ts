import {
  APPEARANCE_ITEM_TYPES,
  AppearanceState,
  DatalessGraph,
  FilteredGraph,
  FiltersState,
  ItemData,
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
import { MultiGraph } from "graphology";
import { Attributes, GraphType } from "graphology-types";
import { clamp, forEach, isNil, isString, keyBy, keys, last, map, mapValues, omit, omitBy } from "lodash";
import { Coordinates } from "sigma/types";

import { getPalette } from "../../components/GraphAppearance/color/utils";
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
import { DYNAMIC_ATTRIBUTES, computeAllDynamicAttributes } from "./dynamicAttributes";
import { FieldModel, GraphDataset, SigmaGraph } from "./types";
import {
  cleanEdge,
  cleanNode,
  dataGraphToSigmaGraph,
  datasetToString,
  getEmptyGraphDataset,
  newItemModel,
  uniqFieldValuesAsStrings,
} from "./utils";

const GRAPH_TRANSFORMATION_METHODS: Record<GraphType, (g: DatalessGraph) => DatalessGraph> = {
  mixed: (g) => {
    const res = new MultiGraph({ type: "mixed" });
    g.forEachNode((node) => res.addNode(node));
    g.forEachEdge((edge, _, source, target) =>
      g.isDirected(edge)
        ? res.addDirectedEdgeWithKey(edge, source, target)
        : res.addUndirectedEdgeWithKey(edge, source, target),
    );
    return res;
  },
  directed: (g) => {
    const res = new MultiGraph({ type: "directed" });
    g.forEachNode((node) => res.addNode(node));
    g.forEachEdge((edge, _, source, target) => res.addDirectedEdgeWithKey(edge, source, target));
    return res;
  },
  undirected: (g) => {
    const res = new MultiGraph({ type: "undirected" });
    g.forEachNode((node) => res.addNode(node));
    g.forEachEdge((edge, _, source, target) => res.addUndirectedEdgeWithKey(edge, source, target));
    return res;
  },
};

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
const setGraphType: Producer<GraphDataset, [GraphType]> = (newType) => {
  return (state) =>
    newType === state.fullGraph.type
      ? state
      : {
          ...state,
          fullGraph: GRAPH_TRANSFORMATION_METHODS[newType](state.fullGraph),
        };
};
const setFieldModel: Producer<GraphDataset, [FieldModel, Record<string, Scalar>?]> = (fieldModel, itemValues) => {
  const fieldsKey = fieldModel.itemType === "nodes" ? "nodeFields" : "edgeFields";
  const dataKey = fieldModel.itemType === "nodes" ? "nodeData" : "edgeData";
  return (state) => {
    const prevFieldsKey = state[fieldsKey];
    const shouldUpdateFields = !!prevFieldsKey.find((f) => f.id === fieldModel.id);
    const newState = {
      ...state,
      [fieldsKey]: shouldUpdateFields
        ? prevFieldsKey.map((field) => (field.id === fieldModel.id ? fieldModel : field))
        : [...prevFieldsKey, fieldModel],
    };

    if (itemValues)
      newState[dataKey] = mapValues(newState[dataKey], (data, itemId) => ({
        ...data,
        [fieldModel.id]: itemValues[itemId] ?? data[fieldModel.id],
      }));

    return newState;
  };
};
const moveFieldModel: Producer<GraphDataset, [ItemType, string, number]> = (
  type: ItemType,
  id: string,
  offset: number,
) => {
  return (state) => {
    const key = type === "nodes" ? "nodeFields" : "edgeFields";
    const newFields: FieldModel[] = state[key].slice(0);
    const currentIndex = newFields.findIndex((f) => f.id === id);
    if (currentIndex === -1) return state;

    const newIndex = clamp(currentIndex + offset, 0, newFields.length - 1);
    // Extract the field:
    const [field] = newFields.splice(currentIndex, 1);
    // Insert it at the wanted position:
    newFields.splice(newIndex, 0, field);

    return {
      ...state,
      [key]: newFields,
    };
  };
};
const createFieldModel: Producer<GraphDataset, [FieldModel, { index?: number; values?: ItemData }?]> = (
  fieldModel,
  { index, values } = {},
) => {
  return (state) => {
    const dataKey = fieldModel.itemType === "nodes" ? "nodeData" : "edgeData";
    const fieldsKey = fieldModel.itemType === "nodes" ? "nodeFields" : "edgeFields";
    const newFields: FieldModel[] = state[fieldsKey].slice(0);
    const newIndex = index !== undefined ? clamp(index, 0, newFields.length) : newFields.length;

    // Insert it at the wanted position:
    newFields.splice(newIndex, 0, fieldModel);
    return {
      ...state,
      [fieldsKey]: newFields,
      [dataKey]: values
        ? mapValues(state[dataKey], (data, itemId) => ({
            ...data,
            [fieldModel.id]: values[itemId] || data[fieldModel.id],
          }))
        : state[dataKey],
    };
  };
};
const deleteFieldModel: Producer<GraphDataset, [FieldModel]> = (fieldModel) => {
  return (state) => {
    const type = fieldModel.itemType;
    const dataKey = type === "nodes" ? "nodeData" : "edgeData";
    const fieldsKey = type === "nodes" ? "nodeFields" : "edgeFields";
    const newFields: FieldModel[] = state[fieldsKey].filter((f) => f.id !== fieldModel.id);

    return {
      ...state,
      [fieldsKey]: newFields,
      [dataKey]: mapValues(state[dataKey], (data) => omit(data, fieldModel.id)),
    };
  };
};
const duplicateFieldModel: Producer<GraphDataset, [FieldModel, string?, number?]> = (fieldModel, id, index) => {
  const type = fieldModel.itemType;
  if (fieldModel.id === id)
    throw new Error(`The new ${type} field model id must be different from the existing one "${id}"`);

  return (state) => {
    const dataKey = type === "nodes" ? "nodeData" : "edgeData";
    const fieldsKey = type === "nodes" ? "nodeFields" : "edgeFields";
    const fields = new Set(state[fieldsKey].map((f) => f.id));
    if (isNil(id)) {
      let i = 1;
      let newId = `${fieldModel.id} (${i})`;
      while (fields.has(newId)) {
        i++;
        newId = `${fieldModel.id} (${i})`;
      }
      id = newId;
    }

    const newFieldModel = {
      ...fieldModel,
      id,
    };
    const newFields: FieldModel[] = state[fieldsKey].slice(0);
    if (fields.has(id)) throw new Error(`A ${type} field model with id "${id}" already exists`);

    const newIndex = clamp(index ?? newFields.findIndex((f) => f.id === fieldModel.id) + 1, 0, newFields.length - 1);
    newFields.splice(newIndex, 0, newFieldModel);
    return {
      ...state,
      [fieldsKey]: newFields,
      [dataKey]: mapValues(state[dataKey], (data) => ({ ...data, [id!]: data[fieldModel.id] })),
    };
  };
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
    const appearanceState = appearanceAtom.get();
    const initialState = getEmptyAppearanceState();

    const newState = {
      ...initialState,
      ...omitBy(appearanceState, (appearanceElement, key: keyof AppearanceState) => {
        if (
          appearanceElement &&
          !isString(appearanceElement) &&
          appearanceElement.field &&
          // here we test only static field
          !appearanceElement.field.dynamic &&
          ((APPEARANCE_ITEM_TYPES[key] === "edges" && !edgeFields.includes(appearanceElement.field.id)) ||
            (APPEARANCE_ITEM_TYPES[key] === "nodes" && !nodeFields.includes(appearanceElement.field.id)))
        ) {
          // this appearance element is based on a field which is not in the model anymore
          // let's reset it
          return true;
        }

        // this appearance is not based on a field or on a field existing in the model
        return false;
      }),
    };

    // to keep appearance state in sync we must check at least partitions
    forEach(newState, (appearanceElement, key: keyof AppearanceState) => {
      if (!appearanceElement || isString(appearanceElement) || !("type" in appearanceElement)) return appearanceElement;
      // TODO
      // - check if data field quali/quanti is still the good one

      // utils variables
      const itemsData = graphDataset[APPEARANCE_ITEM_TYPES[key] === "nodes" ? "nodeData" : "edgeData"];
      let values: string[] = [];

      switch (appearanceElement.type) {
        // - if partitions palette are still in sync with the field values
        case "partition":
          // check if deprecated appearance state
          values = uniqFieldValuesAsStrings(itemsData, appearanceElement.field.id);

          // checking with the actual palette miss some values. It's ok if it has more available.
          if (
            keys(appearanceElement.colorPalette).length < values.length ||
            values.some((v) => appearanceElement.colorPalette[v] === undefined)
          ) {
            // new palette
            // TODO: merge existing palette with the new values, i.e. keep existing colors
            appearanceElement.colorPalette = getPalette(values);
          }
          break;
        // nothing to do for other cases
        // TODO: check if other cases need edits.
      }
    });

    appearanceAtom.set(newState);
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
