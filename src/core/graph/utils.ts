import { forEach, isNumber, mapValues, omit, sortBy, take, uniq } from "lodash";
import Graph, { MultiGraph } from "graphology";
import { Attributes } from "graphology-types";

import {
  DataGraph,
  DatalessGraph,
  EdgeRenderingData,
  FieldModel,
  FullGraph,
  GraphDataset,
  ItemData,
  NodeRenderingData,
  SigmaGraph,
} from "./types";
import { toNumber, toScalar } from "../utils/casting";
import { ItemType, Scalar } from "../types";
import { parse, stringify } from "../utils/json";

export function getRandomNodeCoordinate(): number {
  return Math.random() * 100;
}

export function getEmptyGraphDataset(): GraphDataset {
  return {
    nodeRenderingData: {},
    edgeRenderingData: {},
    nodeData: {},
    edgeData: {},
    metadata: { type: "mixed" },
    nodeFields: [],
    edgeFields: [],
    fullGraph: new MultiGraph<{}, {}>(),
    origin: null,
  };
}

/**
 * Appearance lifecycle helpers (state serialization / deserialization):
 */
export function serializeDataset(dataset: GraphDataset): string {
  return stringify({ ...dataset, fullGraph: dataset.fullGraph.export() });
}
export function parseDataset(rawDataset: string): GraphDataset | null {
  try {
    // TODO:
    // Validate the actual data
    const parsed = parse(rawDataset);
    const fullGraph = new MultiGraph<{}, {}>();
    fullGraph.import(parsed.fullGraph);
    return {
      ...parsed,
      fullGraph,
    };
  } catch (e) {
    return null;
  }
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
  model: Omit<FieldModel<T>, "quantitative" | "qualitative">,
  values: Scalar[],
  itemsCount: number,
): FieldModel<T> {
  const res: FieldModel<T> = {
    ...model,
    qualitative: null,
    quantitative: null,
  };

  if (values.every((v) => isNumber(v))) {
    res.quantitative = { unit: null };
  }

  const uniqValues = uniq(values);
  const uniqValuesCount = uniqValues.length;
  if (uniqValuesCount > 1 && uniqValuesCount < 50 && uniqValuesCount < Math.max(Math.pow(itemsCount, 0.75), 5)) {
    const separator = guessSeparator(
      take(
        uniqValues.map((v) => "" + v),
        100,
      ),
    );

    res.qualitative = { separator };
  }

  return res;
}

export function cleanNode(node: string, attributes: Attributes): { data: ItemData; renderingData: NodeRenderingData } {
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

export function cleanEdge(edge: string, attributes: Attributes): { data: ItemData; renderingData: EdgeRenderingData } {
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
    dataset.nodeFields.push(
      inferFieldType(
        {
          id: key,
          itemType: "nodes",
        },
        values,
        graph.order,
      ),
    );
  });
  forEach(edgeAttributeValues, (values, key) => {
    dataset.edgeFields.push(
      inferFieldType(
        {
          id: key,
          itemType: "edges",
        },
        values,
        graph.size,
      ),
    );
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
