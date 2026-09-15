import {
  AppearanceState,
  FieldModel,
  FiltersState,
  GraphDataset,
  ItemData,
  ItemType,
  NodeCoordinates,
  Scalar,
  getEmptyAppearanceState,
  getEmptyFiltersState,
  getEmptyGraphDataset,
} from "@gephi/gephi-lite-sdk";
import { MultiProducer, Producer, multiProducerToAction, producerToAction } from "@ouestware/atoms";
import { Attributes, GraphType } from "graphology-types";
import { clamp, isNil, keyBy, mapValues, omit } from "lodash";
import { Coordinates } from "sigma/types";

import { checkAppearanceAfterAttributeUpdate } from "../appearance/actions";
import { appearanceAtom } from "../appearance/atom";
import { filtersAtom } from "../filters/atom";
import { edgeIndex, itemsIndex, itemsRemove, nodeIndex, searchActions } from "../search/actions";
import { searchAtom } from "../search/atom";
import { SearchState } from "../search/types";
import { selectionAtom } from "../selection/atom";
import { SelectionState } from "../selection/types";
import { getEmptySelectionState } from "../selection/utils";
import { graphDatasetAtom } from "./atom";
import { GRAPH_TRANSFORMATION_METHODS, cleanEdge, cleanNode, newItemModel } from "./utils";

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
            [fieldModel.id]: !isNil(values[itemId]) ? values[itemId] : data[fieldModel.id],
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
const createNode: MultiProducer<
  [GraphDataset, SearchState],
  [string, { itemData: ItemData; technical: NodeCoordinates }]
> = (node, { itemData = {}, technical }) => {
  return [
    (state) => {
      const { data, position } = cleanNode(node, itemData, technical);
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

const createEdge: MultiProducer<[GraphDataset, SearchState], [string, ItemData, string, string, boolean]> = (
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
const updateNode: MultiProducer<
  [GraphDataset, SearchState, AppearanceState],
  [string, { itemData?: ItemData; technical?: NodeCoordinates; dynamic?: Attributes; merge?: boolean }]
> = (node, { itemData = {}, technical, merge }) => {
  return [
    (state): GraphDataset => {
      const { data, position } = cleanNode(
        node,
        merge ? { ...state.nodeData[node], ...itemData } : itemData,
        technical || state.layout[node],
      );
      const newNodeFieldModel = newItemModel<"nodes">("nodes", data, state.nodeFields);
      return {
        ...state,
        nodeFields: newNodeFieldModel,
        nodeData: { ...state.nodeData, [node]: data },
        layout: { ...state.layout, [node]: position },
      };
    },
    nodeIndex(node),
    checkAppearanceAfterAttributeUpdate("nodes", node, itemData),
  ];
};
const updateEdge: MultiProducer<
  [GraphDataset, SearchState, AppearanceState],
  [string, { itemData?: ItemData; technical?: NodeCoordinates; dynamic?: Attributes; merge?: boolean }]
> = (edge, { itemData = {}, merge, dynamic }) => {
  const directed = dynamic?.directed;

  return [
    (state): GraphDataset => {
      const { data } = cleanEdge(edge, merge ? { ...state.edgeData[edge], ...itemData } : itemData);
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

      return {
        ...state,
        fullGraph,
        edgeFields: newEdgeFieldModel,
        edgeData: { ...state.edgeData, [edge]: data },
      };
    },
    edgeIndex(edge),
    checkAppearanceAfterAttributeUpdate("edges", edge, itemData),
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
  updateNode: multiProducerToAction(updateNode, [graphDatasetAtom, searchAtom, appearanceAtom]),
  updateEdge: multiProducerToAction(updateEdge, [graphDatasetAtom, searchAtom, appearanceAtom]),
  updateItems: multiProducerToAction(updateItems, [graphDatasetAtom, searchAtom]),
  deleteItems: multiProducerToAction(deleteItems, [selectionAtom, graphDatasetAtom, searchAtom]),
  deleteItemsAttribute: producerToAction(deleteItemsAttribute, graphDatasetAtom),

  // Larger actions:
  setGraphDataset: producerToAction(setGraphDataset, graphDatasetAtom),
  setNodePositions: producerToAction(setNodePositions, graphDatasetAtom),
  resetGraph: multiProducerToAction(resetGraph, [filtersAtom, appearanceAtom, selectionAtom, graphDatasetAtom]),
};
