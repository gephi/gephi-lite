import chroma from "chroma-js";
import { forEach, identity } from "lodash";
import { EdgeLabelDrawingFunction } from "sigma/rendering/edge-labels";
import { NodeLabelDrawingFunction } from "sigma/rendering/node-labels";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";

import {
  AppearanceState,
  ColorGetter,
  CustomEdgeDisplayData,
  CustomNodeDisplayData,
  LabelGetter,
  SizeGetter,
  TransformationMethod,
  VisualGetters,
} from "./types";
import {
  EdgeRenderingData,
  GraphDataset,
  DatalessGraph,
  ItemData,
  NodeRenderingData,
  SigmaGraph,
} from "../graph/types";
import { toNumber, toString } from "../utils/casting";
import { parse, stringify } from "../utils/json";
import { ItemType } from "../types";

export const DEFAULT_NODE_COLOR = "#999999";
export const DEFAULT_EDGE_COLOR = "#cccccc";
export const DEFAULT_NODE_SIZE = 20;
export const DEFAULT_EDGE_SIZE = 6;
export const DEFAULT_NODE_LABEL_SIZE = 14;
export const DEFAULT_EDGE_LABEL_SIZE = 14;

export function getEmptyAppearanceState(): AppearanceState {
  return {
    showEdges: true,
    nodesSize: {
      type: "data",
    },
    edgesSize: {
      type: "data",
    },
    nodesColor: {
      type: "data",
    },
    edgesColor: {
      type: "data",
    },
    nodesLabel: {
      type: "data",
    },
    edgesLabel: {
      type: "data",
    },
    nodesLabelSize: {
      type: "fixed",
      value: DEFAULT_NODE_LABEL_SIZE,
      zoomCorrelation: 0,
      density: 1,
    },
    edgesLabelSize: {
      type: "fixed",
      value: DEFAULT_EDGE_LABEL_SIZE,
      zoomCorrelation: 0,
      density: 1,
    },
  };
}

/**
 * Appearance lifecycle helpers (state serialization / deserialization):
 */
export function serializeAppearanceState(appearance: AppearanceState): string {
  return stringify(appearance);
}
export function parseAppearanceState(rawAppearance: string): AppearanceState | null {
  try {
    // TODO:
    // Validate the actual data
    return parse(rawAppearance);
  } catch (e) {
    return null;
  }
}

/**
 * Actual appearance helpers:
 */

export const makeGetValue = (method?: TransformationMethod): ((value?: number) => number | undefined) => {
  // linear
  if (!method) return identity;
  if (typeof method !== "string") {
    //pow
    if ("pow" in method) {
      return (value?: number) => (value !== undefined ? Math.pow(value, method.pow) : undefined);
    }
    //TODO : spline
  }
  //log
  if (method === "log") return (value?: number) => (value !== undefined ? Math.log(value) : undefined);

  return identity;
};

export function makeGetSize<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  { nodeData, edgeData, fullGraph }: GraphDataset,
  { nodesSize, edgesSize }: AppearanceState,
): null | SizeGetter {
  const itemsValues = itemType === "nodes" ? nodeData : edgeData;
  const sizesDef = itemType === "nodes" ? nodesSize : edgesSize;

  let getSize: SizeGetter | null = null;
  switch (sizesDef.type) {
    case "ranking": {
      const getValue = makeGetValue(sizesDef.transformationMethod);
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = getValue(toNumber(data[sizesDef.field]));
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const delta = max - min || 1;
      const ratio = (sizesDef.maxSize - sizesDef.minSize) / delta;
      getSize = (data: ItemData) => {
        const value = getValue(toNumber(data[sizesDef.field]));

        if (typeof value === "number" && !isNaN(value) && Math.abs(value) !== Infinity) {
          return (value - min) * ratio + sizesDef.minSize;
        }
        return sizesDef.missingSize;
      };
      break;
    }
    case "fixed":
      getSize = () => sizesDef.value;
  }

  return getSize;
}

export function makeGetColor<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  { nodeData, edgeData, nodeRenderingData, fullGraph }: GraphDataset,
  { nodesColor, edgesColor }: AppearanceState,
  getters?: VisualGetters,
): ColorGetter | null {
  const itemsValues = itemType === "nodes" ? nodeData : edgeData;
  const colorsDef = itemType === "nodes" ? nodesColor : edgesColor;

  let getColor: ColorGetter | null = null;
  switch (colorsDef.type) {
    case "partition":
      getColor = (data: ItemData) => {
        const value = data[colorsDef.field] as string;
        return value in colorsDef.colorPalette ? colorsDef.colorPalette[value] : colorsDef.missingColor;
      };
      break;
    case "ranking": {
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = toNumber(data[colorsDef.field]);
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const delta = max - min || 1;
      const colorScale = chroma
        .scale(colorsDef.colorScalePoints.map((point) => point.color))
        .domain(colorsDef.colorScalePoints.map((csp) => csp.scalePoint));
      getColor = (data: ItemData) => {
        const value = toNumber(data[colorsDef.field]);
        if (typeof value === "number") {
          return colorScale((value - min) / delta).hex();
        }
        return colorsDef.missingColor;
      };
      break;
    }
    case "fixed":
      getColor = () => colorsDef.value;
  }

  if (itemType === "edges" && ["source", "target"].includes(colorsDef.type)) {
    const getNodeColor = (getters as VisualGetters | undefined)?.getNodeColor;
    const nodeForColor =
      colorsDef.type === "source" ? (id?: string) => fullGraph.source(id) : (id?: string) => fullGraph.target(id);

    if (getNodeColor && nodesColor.type !== "data")
      getColor = (_, edgeId?: string) =>
        nodeForColor(edgeId) ? getNodeColor(nodeData[nodeForColor(edgeId)]) : DEFAULT_NODE_COLOR;
    else if (nodesColor.type === "data")
      // special case when node are colored by data have to reach nodeRenderingData instead of normal getNodeColor
      getColor = (_, edgeId?: string) => {
        return nodeForColor(edgeId) &&
          nodeRenderingData[nodeForColor(edgeId)] &&
          nodeRenderingData[nodeForColor(edgeId)].color
          ? nodeRenderingData[nodeForColor(edgeId)].color || DEFAULT_NODE_COLOR
          : DEFAULT_NODE_COLOR;
      };
    else getColor = () => DEFAULT_EDGE_COLOR;
  }

  return getColor;
}

export function makeGetLabel<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  { nodeData, edgeData, fullGraph, nodeRenderingData }: GraphDataset,
  { nodesLabel, edgesLabel }: AppearanceState,
): LabelGetter | null {
  const labelsDef = itemType === "nodes" ? nodesLabel : edgesLabel;

  let getLabel: LabelGetter | null = null;
  switch (labelsDef.type) {
    case "none":
      getLabel = () => null;
      break;
    case "fixed":
      getLabel = () => labelsDef.value;
      break;
    case "field":
      getLabel = (data: ItemData) => {
        const label = toString(data[labelsDef.field]);
        return typeof label === "string" ? label : labelsDef.missingLabel;
      };
      break;
  }

  return getLabel;
}

export function getAllVisualGetters(dataset: GraphDataset, appearance: AppearanceState): VisualGetters {
  const nodeVisualGetters: VisualGetters = {
    getNodeSize: makeGetSize("nodes", dataset, appearance),
    getNodeColor: makeGetColor("nodes", dataset, appearance),
    getNodeLabel: makeGetLabel("nodes", dataset, appearance),
    getEdgeSize: null,
    getEdgeColor: null,
    getEdgeLabel: null,
  };

  return {
    ...nodeVisualGetters,
    getEdgeSize: makeGetSize("edges", dataset, appearance),
    getEdgeColor: makeGetColor("edges", dataset, appearance, nodeVisualGetters),
    getEdgeLabel: makeGetLabel("edges", dataset, appearance),
  };
}
export function applyVisualProperties(graph: SigmaGraph, dataset: GraphDataset, getters: VisualGetters): void {
  graph.forEachNode((node) => {
    const attr: Partial<NodeRenderingData> = {};
    if (getters.getNodeSize) {
      attr.size = getters.getNodeSize(dataset.nodeData[node]);
      // store raw size to compute label size independent to zoom
      attr.rawSize = attr.size;
    }
    if (getters.getNodeColor) attr.color = getters.getNodeColor(dataset.nodeData[node]);
    if (getters.getNodeLabel) attr.label = getters.getNodeLabel(dataset.nodeData[node]);
    graph.mergeNodeAttributes(node, attr);
  });

  graph.forEachEdge((edge) => {
    const attr: Partial<EdgeRenderingData> = {};
    if (getters.getEdgeSize) {
      attr.weight = getters.getEdgeSize(dataset.edgeData[edge]);
      // store raw weight to compute label size independent to zoom
      attr.rawWeight = attr.weight;
    }
    if (getters.getEdgeColor) attr.color = getters.getEdgeColor(dataset.edgeData[edge], edge);
    if (getters.getEdgeLabel) attr.label = getters.getEdgeLabel(dataset.edgeData[edge]);
    graph.mergeEdgeAttributes(edge, attr);
  });
}

/**
 * Rendering helpers:
 */
export function getNodeDrawFunction({ nodesLabelSize }: AppearanceState, draw: NodeLabelDrawingFunction) {
  return ((context, data: CustomNodeDisplayData, settings) => {
    let labelSize =
      nodesLabelSize.type === "fixed"
        ? nodesLabelSize.value
        : ((data.rawSize as number) * nodesLabelSize.sizeCorrelation) / DEFAULT_NODE_LABEL_SIZE;
    if (nodesLabelSize.zoomCorrelation >= 1) labelSize = (labelSize * data.size) / data.rawSize;
    else if (nodesLabelSize.zoomCorrelation >= 0)
      labelSize = labelSize * Math.pow(data.size / data.rawSize, nodesLabelSize.zoomCorrelation);
    return draw(
      context,
      {
        ...data,
        label: data.hideLabel ? null : data.label,
      },
      { ...settings, labelSize, labelWeight: data.boldLabel ? "bold" : "normal" },
    );
  }) as NodeLabelDrawingFunction;
}

export function getDrawEdgeLabel({ edgesLabelSize }: AppearanceState, draw: EdgeLabelDrawingFunction) {
  return ((context, data: CustomEdgeDisplayData, sourceData, targetData, settings) => {
    let edgeLabelSize =
      edgesLabelSize.type === "fixed" ? edgesLabelSize.value : data.rawSize * edgesLabelSize.sizeCorrelation;
    if (edgesLabelSize.zoomCorrelation >= 1) edgeLabelSize = (edgeLabelSize * data.size) / data.rawSize;
    else if (edgesLabelSize.zoomCorrelation >= 0)
      edgeLabelSize = edgeLabelSize * Math.pow(data.size / data.rawSize, edgesLabelSize.zoomCorrelation);
    return draw(context, data, sourceData, targetData, { ...settings, edgeLabelSize });
  }) as EdgeLabelDrawingFunction;
}

export function getItemAttributes(
  type: ItemType,
  id: string,
  filteredGraph: DatalessGraph,
  graphDataset: GraphDataset,
  visualGetters: VisualGetters,
): { label: string | undefined; color: string; hidden?: boolean; directed?: boolean } {
  const data = type === "nodes" ? graphDataset.nodeData[id] : graphDataset.edgeData[id];
  const renderingData = type === "nodes" ? graphDataset.nodeRenderingData[id] : graphDataset.edgeRenderingData[id];
  const getLabel = type === "nodes" ? visualGetters.getNodeLabel : visualGetters.getEdgeLabel;
  const getColor = type === "nodes" ? visualGetters.getNodeColor : visualGetters.getEdgeColor;
  const defaultColor = type === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
  const hidden = type === "nodes" ? !filteredGraph.hasNode(id) : !filteredGraph.hasEdge(id);

  return {
    label: (getLabel ? getLabel(data) : renderingData.label) || undefined,
    color: getColor ? getColor(data, id) : renderingData.color || defaultColor,
    hidden,
    directed: graphDataset.metadata.type !== "undirected",
  };
}
