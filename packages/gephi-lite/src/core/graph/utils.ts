import { NodeCoordinates, getEmptyGraphDataset, toNumber, toScalar } from "@gephi/gephi-lite-sdk";
import Graph, { MultiGraph } from "graphology";
import { Attributes } from "graphology-types";
import { flatMap, forEach, isNil, isNumber, keyBy, keys, mapValues, omit, sortBy, uniq, values } from "lodash";

import { ItemType, Scalar } from "../types";
import { inferFieldType } from "./fieldModel";
import {
  DataGraph,
  DatalessGraph,
  EdgeRenderingData,
  FieldModel,
  FieldModelWithStats,
  FullGraph,
  GraphDataset,
  ItemData,
  NodeRenderingData,
  SigmaGraph,
} from "./types";

export { datasetToString, getEmptyGraphDataset, parseDataset } from "@gephi/gephi-lite-sdk";

export function getRandomNodeCoordinate(): number {
  return Math.random() * 1000;
}

export function cleanNode(_node: string, attributes: Attributes): { data: ItemData; position: NodeCoordinates } {
  const x = toNumber(attributes.x);
  const y = toNumber(attributes.y);

  const position: NodeCoordinates = {
    x: typeof x === "number" ? x : getRandomNodeCoordinate(),
    y: typeof y === "number" ? y : getRandomNodeCoordinate(),
  };

  const data: ItemData = mapValues(omit(attributes, "x", "y"), (v) => toScalar(v));

  return { data, position };
}

export function cleanEdge(_edge: string, attributes: Attributes): { data: ItemData } {
  const data: ItemData = mapValues(attributes, (v) => toScalar(v));

  return { data };
}

/**
 * This function takes any graphology instance (like returned by any graphology
 * importer basically), and returns a properly shaped graph dataset:
 */
export function initializeGraphDataset(
  graph: Graph,
  { nodeFields, edgeFields }: { nodeFields?: FieldModel<"nodes">[]; edgeFields?: FieldModel<"edges">[] } = {},
): GraphDataset {
  const dataset = getEmptyGraphDataset({ graphType: graph.type });

  // setting graph meta data
  if (graph.hasAttribute("title")) dataset.metadata.title = graph.getAttribute("title");
  if (graph.hasAttribute("description")) dataset.metadata.description = graph.getAttribute("description");

  const nodeAttributeValues: Record<string, Scalar[]> = {};
  graph.forEachNode((node, attributes) => {
    const { data, position } = cleanNode(node, attributes);

    for (const key in data) {
      nodeAttributeValues[key] = nodeAttributeValues[key] || [];
      nodeAttributeValues[key].push(data[key]);
    }

    dataset.fullGraph.addNode(node, {});
    dataset.layout[node] = position;
    dataset.nodeData[node] = data;
  });

  const edgeAttributeValues: Record<string, Scalar[]> = {};
  graph.forEachEdge((edge, attributes, source, target) => {
    const { data } = cleanEdge(edge, attributes);

    for (const key in data) {
      edgeAttributeValues[key] = edgeAttributeValues[key] || [];
      edgeAttributeValues[key].push(data[key]);
    }

    dataset.fullGraph.addEdgeWithKey(edge, source, target, {});
    dataset.edgeData[edge] = data;
  });

  // Infer model:
  const nodeFieldsDict = keyBy(nodeFields, "id");
  const edgeFieldsDict = keyBy(edgeFields, "id");

  forEach(nodeAttributeValues, (values, key) => {
    dataset.nodeFields.push(
      nodeFieldsDict[key] || {
        id: key,
        itemType: "nodes",
        ...inferFieldType(key, values, graph.order),
      },
    );
  });
  forEach(edgeAttributeValues, (values, key) => {
    dataset.edgeFields.push(
      edgeFieldsDict[key] || {
        id: key,
        itemType: "edges",
        ...inferFieldType(key, values, graph.size),
      },
    );
  });

  const labelsOrder = ["label", "size", "weight", "color"];
  const getFieldScore = (field: FieldModel) => {
    const cleanedName = field.id.trim().toLowerCase();
    const index = labelsOrder.indexOf(cleanedName);
    return index >= 0 ? index : Infinity;
  };
  dataset.nodeFields = sortBy(dataset.nodeFields, getFieldScore) as typeof dataset.nodeFields;
  dataset.edgeFields = sortBy(dataset.edgeFields, getFieldScore) as typeof dataset.edgeFields;

  return dataset;
}

/**
 * This function takes a graph dataset (and optionally a DatalessGraph as input)
 * and returns a FullGraph:
 */
export function dataGraphToFullGraph(
  { fullGraph, layout, nodeData, edgeData }: GraphDataset,
  graph: DatalessGraph = fullGraph,
) {
  const res: FullGraph = new MultiGraph({ type: fullGraph.type });

  // Nodes
  graph.forEachNode((node) => res.addNode(node, { ...nodeData[node], ...layout[node] }));

  // Edges
  graph.forEachEdge((edge, _, source, target) => {
    if (res.type === "undirected" || (res.type === "mixed" && !graph.isDirected(edge)))
      res.addUndirectedEdgeWithKey(edge, source, target, { ...edgeData[edge], ...layout[edge] });
    else res.addDirectedEdgeWithKey(edge, source, target, { ...edgeData[edge], ...layout[edge] });
  });

  return res;
}

/**
 * This function takes a graph dataset (and optionally a DatalessGraph as input)
 * and returns a SigmaGraph:
 */
export function dataGraphToSigmaGraph({ fullGraph, layout }: GraphDataset, graph: DatalessGraph = fullGraph) {
  const res: SigmaGraph = new MultiGraph<NodeRenderingData, EdgeRenderingData>({ type: graph.type });
  graph.forEachNode((node) => res.addNode(node, { ...layout[node] }));
  graph.forEachEdge((edge, _, source, target) => {
    if (res.type === "undirected" || (res.type === "mixed" && !graph.isDirected(edge)))
      res.addUndirectedEdgeWithKey(edge, source, target, {});
    else res.addDirectedEdgeWithKey(edge, source, target, {});
  });
  return res;
}

/**
 * This function takes a full GraphDataset and a filtered SigmaGraph, and
 * returns a filtered DataGraph (with only the filtered nodes and edges, but
 * each item has all its data attributes):
 */
export function getFilteredDataGraph({ nodeData, edgeData }: GraphDataset, graph: SigmaGraph): DataGraph {
  const res = new MultiGraph<ItemData, ItemData>({ type: graph.type });

  graph.forEachNode((node) => {
    res.addNode(node, nodeData[node] || {});
  });
  graph.forEachEdge((edge, _, source, target) => {
    if (res.type === "undirected" || (res.type === "mixed" && !graph.isDirected(edge)))
      res.addUndirectedEdgeWithKey(edge, source, target, edgeData[edge] || {});
    else res.addDirectedEdgeWithKey(edge, source, target, edgeData[edge] || {});
  });

  return res;
}

/**
 * This functions returns the item fields models if a create/update item payload contains unknown attributes
 * update in the state must be done in the context calling this method.
 */
export function newItemModel<T extends ItemType>(
  itemType: T,
  itemAttributes: ItemData,
  itemFieldModel: FieldModel<T>[],
): FieldModel<T>[] {
  // check if fieldModel needs an update
  const newAttributes = keys(itemAttributes).filter((key) => itemFieldModel.find((f) => f.id === key) === undefined);
  if (newAttributes.length > 0) {
    // guess attribute type
    return [
      ...itemFieldModel,
      ...newAttributes.map((newAttribute) => {
        // we don't use utils.inderFieldType here as we only have one value and we know for sure it's not a multiple
        // TODO: discuss if we can do some better inference
        const type = isNumber(itemAttributes[newAttribute]) ? "number" : "text";
        const fieldModel: FieldModel<T> = {
          id: newAttribute,
          itemType,
          type,
        };
        console.debug(`updating ${itemType} fieldModel with new attributes : ${JSON.stringify(fieldModel, null, 2)}`);
        return fieldModel;
      }),
    ];
  }
  return itemFieldModel;

  // Here we don't look for attributes which are in the model but not in the payload.
  // We could try to detect that an attribute has been deleted from all nodes but this would require iterating through all the graph nodes.
  // but removing the model is not necessarily a good thing?  Keeping it does not harm much and model deletion might be better handled through a specific action.
  // To be decided later see https://github.com/gephi/gephi-lite/issues/117
}

/**
 * This functions counts the number of item (node/edge) having a data attribute set for all fields in a model
 */
export function countExistingValues(
  fieldModel: FieldModel[],
  itemsData: Record<string, ItemData>,
): FieldModelWithStats[] {
  const items = values(itemsData);
  return fieldModel.map((fm) => {
    let nbItems = 0;
    let nbCastIssues = 0;
    let nbMissingValues = 0;
    items.forEach((item) => {
      if (!isNil(item[fm.id])) {
        // attribute exists
        nbItems += 1;
        // is format correct?
        const value = item[fm.id];
        //TODO: if we keep this we need to cover all model value type cases
        if (fm.type === "number" && typeof item[fm.id] !== "number" && !isNil(value) && isNaN(+value))
          nbCastIssues += 1;
      } else nbMissingValues += 1;
    });
    return {
      ...fm,
      stats: {
        nbItems,
        nbCastIssues,
        nbMissingValues,
      },
    };
  });
}
/**
 * This functions returns all uniq values in one item field
 */
export function uniqFieldValuesAsStrings(items: Record<string, ItemData>, field: string) {
  return uniq(
    flatMap(items, (itemData) => {
      const v = itemData[field];
      if (typeof v === "number" || (typeof v === "string" && !!v)) return [v + ""];
      return [];
    }),
  ) as string[];
}
