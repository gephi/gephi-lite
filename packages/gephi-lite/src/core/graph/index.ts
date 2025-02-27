import {
  APPEARANCE_ITEM_TYPES,
  AppearanceState,
  FilteredGraph,
  FiltersState,
  getEmptyAppearanceState,
} from "@gephi/gephi-lite-sdk";
import { MultiProducer, Producer, atom, derivedAtom, multiProducerToAction, producerToAction } from "@ouestware/atoms";
import EventEmitter from "events";
import { Attributes } from "graphology-types";
import { forEach, isNil, isString, keys, last, mapValues, omit, omitBy } from "lodash";
import { Coordinates } from "sigma/types";

import { getPalette } from "../../components/GraphAppearance/color/utils";
import { appearanceAtom } from "../appearance";
import { applyVisualProperties, getAllVisualGetters } from "../appearance/utils";
import { filtersAtom } from "../filters";
import { buildTopologicalFiltersDefinitions } from "../filters/topological";
import { FilterType } from "../filters/types";
import { applyFilters, getEmptyFiltersState } from "../filters/utils";
import { itemsRemove, searchActions, searchAtom } from "../search";
import { SearchState } from "../search/types";
import { selectionAtom } from "../selection";
import { SelectionState } from "../selection/types";
import { getEmptySelectionState } from "../selection/utils";
import { ItemType } from "../types";
import { computeAllDynamicAttributes, dynamicAttributes } from "./dynamicAttributes";
import { DynamicItemData, FieldModel, GraphDataset, SigmaGraph } from "./types";
import {
  cleanEdge,
  cleanNode,
  dataGraphToSigmaGraph,
  datasetToString,
  getEmptyGraphDataset,
  newItemModel,
  uniqFieldvaluesAsStrings,
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

const resetGraph: MultiProducer<[FiltersState, AppearanceState, SelectionState, GraphDataset], []> = () => {
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
  [graphDatasetAtom, filteredGraphsAtom],
  (graphDataset, filteredGraphCache) => {
    return last(filteredGraphCache)?.graph || graphDataset.fullGraph;
  },
  { checkInput: false },
);
export const dynamicItemDataAtom = derivedAtom(
  // filteredGraphsAtom is added in the dependencies because derived from derived are not triggered correctly. To be investigated later
  [filteredGraphAtom, filteredGraphsAtom],
  (filteredGraphCache) => {
    const dynamicNodeData: DynamicItemData = {
      dynamicNodeData: computeAllDynamicAttributes("nodes", filteredGraphCache),
      dynamicNodeFields: dynamicAttributes.nodes?.map((n) => n.field) || [],
      dynamicEdgeData: computeAllDynamicAttributes("edges", filteredGraphCache),

      dynamicEdgeFields: dynamicAttributes.edges?.map((n) => n.field) || [],
    };
    return dynamicNodeData;
  },
  { checkInput: false },
);
export const parentFilteredGraphAtom = derivedAtom(
  [graphDatasetAtom, filteredGraphsAtom],
  (graphDataset, filteredGraphCache) => {
    return filteredGraphCache[filteredGraphCache.length - 2]?.graph || graphDataset.fullGraph;
  },
  { checkInput: false },
);
export const visualGettersAtom = derivedAtom(
  [graphDatasetAtom, dynamicItemDataAtom, appearanceAtom],
  getAllVisualGetters,
  {
    checkInput: false,
  },
);
export const topologicalFiltersAtom = derivedAtom(graphDatasetAtom, ({ metadata }) =>
  buildTopologicalFiltersDefinitions(metadata.type !== "undirected"),
);
export const sigmaGraphAtom = derivedAtom(
  [graphDatasetAtom, filteredGraphAtom, visualGettersAtom],
  (dataset, filteredGraph, visualGetters, graph: SigmaGraph | undefined) => {
    const dynamicItemData = dynamicItemDataAtom.get();
    const newGraph = dataGraphToSigmaGraph(dataset, filteredGraph);
    applyVisualProperties(newGraph, dataset, dynamicItemData, visualGetters);

    if (graph) {
      graph.clear();
      graph.import(newGraph);
      (graph as EventEmitter).emit("graphImported");

      return graph;
    }

    return newGraph;
  },
  { debounce: true, checkInput: false },
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
  deleteItems: multiProducerToAction(deleteItems, [searchAtom, selectionAtom, graphDatasetAtom]),
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
  if (updatedKeys.has("fullGraph") || updatedKeys.has("nodeRenderingData") || updatedKeys.has("edgeRenderingData")) {
    const filtersState = filtersAtom.get();
    const newCache = applyFilters(graphDataset, filtersState.past, [], topologicalFiltersAtom.get());
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
      !("field" in f) || nodeFields.includes(f.field.field) || edgeFields.includes(f.field.field);
    filtersAtom.set({
      past: filtersState.past.filter(filterFilters),
      future: filtersState.future.filter(filterFilters),
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
          ((APPEARANCE_ITEM_TYPES[key] === "edges" && !edgeFields.includes(appearanceElement.field.field)) ||
            (APPEARANCE_ITEM_TYPES[key] === "nodes" && !nodeFields.includes(appearanceElement.field.field)))
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
          values = uniqFieldvaluesAsStrings(itemsData, appearanceElement.field.field);

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

  // When graph meta change, we set the page metadata
  if (updatedKeys.has("metadata")) {
    document.title = ["Gephi Lite", graphDataset.metadata.title].filter((s) => !isNil(s)).join(" - ");
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
  const cache = filteredGraphsAtom.get();
  const dataset = graphDatasetAtom.get();

  const newCache = applyFilters(dataset, filtersState.past, cache, topologicalFiltersAtom.get());
  filteredGraphsAtom.set(newCache);
});
