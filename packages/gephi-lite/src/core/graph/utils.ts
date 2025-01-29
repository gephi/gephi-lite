import { getEmptyGraphDataset, toNumber, toScalar } from "@gephi/gephi-lite-sdk";
import Graph, { MultiGraph } from "graphology";
import { Attributes } from "graphology-types";
import { flatMap, forEach, isNil, isNumber, keys, mapValues, omit, sortBy, take, uniq, values } from "lodash";

import { ItemType, Scalar } from "../types";
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

export { parseDataset, datasetToString, getEmptyGraphDataset } from "@gephi/gephi-lite-sdk";

export function getRandomNodeCoordinate(): number {
  return Math.random() * 100;
}

/**
 * This function takes an array of string values, and tries various separators
 * to see if one does match enough values.
 */
const SEPARATORS = [";", ",", "|"] as const;
type Separator = (typeof SEPARATORS)[number];
export function guessSeparator(values: string[]): string | null {
  const separatorsFrequencies = SEPARATORS.reduce(
    (iter, sep) => ({
      ...iter,
      [sep]: 0,
    }),
    {},
  ) as Record<Separator, number>;

  values.forEach((value) =>
    SEPARATORS.forEach((sep) => {
      const split = value.split(sep);
      if (split.length > 1 && split.every((s) => !!s && !s.match(/(^ | $)/))) separatorsFrequencies[sep]++;
    }),
  );

  const bestSeparator = sortBy(
    SEPARATORS.filter((sep) => !!separatorsFrequencies[sep]),
    (sep) => -separatorsFrequencies[sep],
  )[0];
  return bestSeparator || null;
}

/**
 * This function takes an unqualified field model and a list af values, and
 * guesses whether that field should be considered qualitative and/or
 * quantitative:
 */
export function inferFieldType<T extends ItemType = ItemType>(
  values: Scalar[],
  itemsCount: number,
): Pick<FieldModel<T>, "quantitative" | "qualitative"> {
  const res: Pick<FieldModel<T>, "quantitative" | "qualitative"> = {
    qualitative: null,
    quantitative: null,
  };

  if (values.every((v) => isNumber(v))) {
    res.quantitative = { unit: null };
  }

  const separator = guessSeparator(
    take(
      values.map((v) => "" + v),
      100,
    ),
  );
  const uniqValues = uniq(separator ? values.flatMap((v) => (v + "").split(separator)) : values);
  const uniqValuesCount = uniqValues.length;

  if (
    uniqValuesCount > 1 &&
    uniqValuesCount < 50 &&
    uniqValuesCount < Math.max(separator ? itemsCount : Math.pow(itemsCount, 0.75), 5)
  ) {
    res.qualitative = { separator };
  }

  return res;
}

export function cleanNode(_node: string, attributes: Attributes): { data: ItemData; renderingData: NodeRenderingData } {
  const x = toNumber(attributes.x);
  const y = toNumber(attributes.y);

  const renderingData: NodeRenderingData = {
    label: typeof attributes.label === "string" ? attributes.label : undefined,
    color: typeof attributes.color === "string" ? attributes.color : undefined,
    size: toNumber(attributes.size),
    x: typeof x === "number" ? x : getRandomNodeCoordinate(),
    y: typeof y === "number" ? y : getRandomNodeCoordinate(),
  };

  const data: ItemData = mapValues(omit(attributes, "label", "color", "size", "x", "y"), (v) => toScalar(v));

  return { data, renderingData };
}

export function cleanEdge(_edge: string, attributes: Attributes): { data: ItemData; renderingData: EdgeRenderingData } {
  const renderingData: EdgeRenderingData = {
    label: typeof attributes.label === "string" ? attributes.label : undefined,
    color: typeof attributes.color === "string" ? attributes.color : undefined,
    weight: toNumber(attributes.weight),
  };

  const data: ItemData = mapValues(omit(attributes, "label", "color", "weight"), (v) => toScalar(v));

  return { data, renderingData };
}

/**
 * This function takes any graphology instance (like returned by any graphology
 * importer basically), and returns a properly shaped graph dataset:
 */
export function initializeGraphDataset(graph: Graph): GraphDataset {
  const dataset = getEmptyGraphDataset();

  // setting graph meta data
  dataset.metadata.type = graph.type;
  if (graph.hasAttribute("title")) dataset.metadata.title = graph.getAttribute("title");
  if (graph.hasAttribute("keywords")) dataset.metadata.keywords = graph.getAttribute("keywords");
  if (graph.hasAttribute("creator")) dataset.metadata.authors = graph.getAttribute("creator");
  if (graph.hasAttribute("description")) dataset.metadata.description = graph.getAttribute("description");

  const nodeAttributeValues: Record<string, Scalar[]> = {};
  graph.forEachNode((node, attributes) => {
    const { data, renderingData } = cleanNode(node, attributes);

    for (const key in data) {
      nodeAttributeValues[key] = nodeAttributeValues[key] || [];
      nodeAttributeValues[key].push(data[key]);
    }

    dataset.fullGraph.addNode(node, {});
    dataset.nodeRenderingData[node] = renderingData;
    dataset.nodeData[node] = data;
  });

  const edgeAttributeValues: Record<string, Scalar[]> = {};
  graph.forEachEdge((edge, attributes, source, target) => {
    const { data, renderingData } = cleanEdge(edge, attributes);

    for (const key in data) {
      edgeAttributeValues[key] = edgeAttributeValues[key] || [];
      edgeAttributeValues[key].push(data[key]);
    }

    dataset.fullGraph.addEdgeWithKey(edge, source, target, {});
    dataset.edgeRenderingData[edge] = renderingData;
    dataset.edgeData[edge] = data;
  });

  // Infer model:
  forEach(nodeAttributeValues, (values, key) => {
    dataset.nodeFields.push({
      id: key,
      itemType: "nodes",
      ...inferFieldType(values, graph.order),
    });
  });
  forEach(edgeAttributeValues, (values, key) => {
    dataset.edgeFields.push({
      id: key,
      itemType: "edges",
      ...inferFieldType(values, graph.size),
    });
  });

  return dataset;
}

/**
 * This function takes a graph dataset (and optionally a DatalessGraph as input)
 * and returns a FullGraph:
 */
export function dataGraphToFullGraph(
  { fullGraph, nodeRenderingData, edgeRenderingData, nodeData, edgeData, metadata }: GraphDataset,
  graph: DatalessGraph = fullGraph,
) {
  const res: FullGraph = new MultiGraph<
    NodeRenderingData & ItemData,
    EdgeRenderingData & ItemData,
    Omit<GraphDataset["metadata"], "type">
  >();

  // metadata
  res.replaceAttributes(omit(metadata, ["type"]));

  // nodes
  graph.forEachNode((node) => res.addNode(node, { ...nodeData[node], ...nodeRenderingData[node] }));

  // edges
  graph.forEachEdge((edge, _, source, target) =>
    res.addEdgeWithKey(edge, source, target, { ...edgeData[edge], ...edgeRenderingData[edge] }),
  );

  return res;
}

/**
 * This function takes a graph dataset (and optionally a DatalessGraph as input)
 * and returns a SigmaGraph:
 */
export function dataGraphToSigmaGraph(
  { fullGraph, nodeRenderingData, edgeRenderingData }: GraphDataset,
  graph: DatalessGraph = fullGraph,
) {
  const res: SigmaGraph = new MultiGraph<NodeRenderingData, EdgeRenderingData>();
  graph.forEachNode((node) => res.addNode(node, { ...nodeRenderingData[node] }));
  graph.forEachEdge((edge, _, source, target) =>
    res.addEdgeWithKey(edge, source, target, { ...edgeRenderingData[edge] }),
  );
  return res;
}

/**
 * This function takes a full GraphDataset and a filtered SigmaGraph, and
 * returns a filtered DataGraph (with only the filtered nodes and edges, but
 * each item has all its data attributes):
 */
export function getFilteredDataGraph({ nodeData, edgeData }: GraphDataset, graph: SigmaGraph): DataGraph {
  const res = new MultiGraph<ItemData, ItemData>();

  graph.forEachNode((node) => {
    res.addNode(node, nodeData[node] || {});
  });
  graph.forEachEdge((edge, _, source, target) => {
    res.addEdgeWithKey(edge, source, target, edgeData[edge] || {});
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
        const type = isNumber(itemAttributes[newAttribute]) ? "quantitative" : "qualitative";
        const fieldModel: FieldModel<T> = {
          id: newAttribute,
          itemType,
          qualitative: type === "qualitative" ? {} : null,
          quantitative: type === "quantitative" ? {} : null,
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
        if (fm.quantitative && typeof item[fm.id] !== "number" && !isNil(value) && isNaN(+value)) nbCastIssues += 1;
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
export function uniqFieldvaluesAsStrings(items: Record<string, ItemData>, field: string) {
  return uniq(
    flatMap(items, (itemData) => {
      const v = itemData[field];
      if (typeof v === "number" || (typeof v === "string" && !!v)) return [v + ""];
      return [];
    }),
  ) as string[];
}
