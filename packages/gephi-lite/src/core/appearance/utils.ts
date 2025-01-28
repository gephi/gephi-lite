import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_LABEL_SIZE,
  toNumber,
  toString,
} from "@gephi/gephi-lite-sdk";
import chroma from "chroma-js";
import { Attributes } from "graphology-types";
import { forEach, identity } from "lodash";
import { EdgeLabelDrawingFunction, NodeLabelDrawingFunction } from "sigma/rendering";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";

import {
  DatalessGraph,
  EdgeRenderingData,
  GraphDataset,
  ItemData,
  NodeRenderingData,
  SigmaGraph,
} from "../graph/types";
import { ItemType } from "../types";
import {
  AppearanceState,
  ColorGetter,
  CustomEdgeDisplayData,
  CustomNodeDisplayData,
  NumberGetter,
  StringAttrGetter,
  TransformationMethod,
  VisualGetters,
} from "./types";

export {
  DEFAULT_NODE_COLOR,
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_SIZE,
  DEFAULT_EDGE_SIZE,
  DEFAULT_NODE_LABEL_SIZE,
  DEFAULT_EDGE_LABEL_SIZE,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_LAYOUT_GRID_COLOR,
  DEFAULT_REFINEMENT_COLOR,
} from "@gephi/gephi-lite-sdk";

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

export function makeGetNumberAttr<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  itemKey: "size" | "zIndex",
  { nodeData, edgeData }: GraphDataset,
  { nodesSize, edgesSize, edgesZIndex }: AppearanceState,
): null | NumberGetter {
  const numberAttrDef = itemKey === "zIndex" ? edgesZIndex : itemType === "nodes" ? nodesSize : edgesSize;
  const itemsValues = itemType === "nodes" ? nodeData : edgeData;

  let getNumberValue: NumberGetter | null = null;
  switch (numberAttrDef.type) {
    case "ranking": {
      const getValue = makeGetValue(numberAttrDef.transformationMethod);
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = getValue(toNumber(data[numberAttrDef.field]));
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const delta = max - min || 1;
      const ratio = (numberAttrDef.maxSize - numberAttrDef.minSize) / delta;
      getNumberValue = (data: ItemData) => {
        const value = getValue(toNumber(data[numberAttrDef.field]));

        if (typeof value === "number" && !isNaN(value) && Math.abs(value) !== Infinity) {
          return (value - min) * ratio + numberAttrDef.minSize;
        }
        return numberAttrDef.missingSize;
      };
      break;
    }
    case "field": {
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = toNumber(data[numberAttrDef.field]);
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const [minIndex, maxIndex] = numberAttrDef.reversed ? [10, 1] : [1, 10];
      const delta = max - min || 1;
      const ratio = (maxIndex - minIndex) / delta;
      getNumberValue = (data: ItemData) => {
        const value = toNumber(data[numberAttrDef.field]);

        if (typeof value === "number" && !isNaN(value) && Math.abs(value) !== Infinity) {
          return (value - min) * ratio + minIndex;
        }

        return 0;
      };
      break;
    }
    case "fixed":
      getNumberValue = () => numberAttrDef.value;
  }

  return getNumberValue;
}

export function makeGetColor<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  { nodeData, edgeData, nodeRenderingData, fullGraph }: GraphDataset,
  { nodesColor, edgesColor, nodesRefinementColor, edgesRefinementColor }: AppearanceState,
  getters?: VisualGetters,
): ColorGetter | null {
  const itemsValues = itemType === "nodes" ? nodeData : edgeData;
  const colorsDef = itemType === "nodes" ? nodesColor : edgesColor;
  const refinementDef = itemType === "nodes" ? nodesRefinementColor : edgesRefinementColor;

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
      colorsDef.type === "source"
        ? (id?: string) => id && fullGraph.source(id)
        : (id?: string) => id && fullGraph.target(id);

    if (getNodeColor && nodesColor.type !== "data")
      getColor = (_, edgeId?: string) => {
        const node = nodeForColor(edgeId);
        return node ? getNodeColor(nodeData[node]) : DEFAULT_NODE_COLOR;
      };
    else if (nodesColor.type === "data")
      // special case when node are colored by data have to reach nodeRenderingData instead of normal getNodeColor
      getColor = (_, edgeId?: string) => {
        const node = nodeForColor(edgeId);
        return node && nodeRenderingData[node] && nodeRenderingData[node].color
          ? nodeRenderingData[node].color || DEFAULT_NODE_COLOR
          : DEFAULT_NODE_COLOR;
      };
    else getColor = () => DEFAULT_EDGE_COLOR;
  }

  if (getColor && refinementDef) {
    let min = Infinity,
      max = -Infinity;
    forEach(itemsValues, (data) => {
      const value = toNumber(data[refinementDef.field]);
      if (typeof value === "number") {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });
    const factor = refinementDef.factor / (max - min || 1);

    const rawGetColor = getColor;
    getColor = (data: ItemData, edgeId?: string) => {
      const color = rawGetColor(data, edgeId);
      const value = toNumber(data[refinementDef.field]);

      if (typeof value === "number") {
        return chroma
          .scale([color, refinementDef.targetColor])(value === max ? refinementDef.factor : (value - min) * factor)
          .hex();
      }

      return refinementDef.missingColor || color;
    };
  }

  return getColor;
}

export function makeGetStringAttr<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  itemKey: "images" | "labels",
  _graphDataset: GraphDataset,
  { nodesLabel, edgesLabel, nodesImage }: AppearanceState,
): StringAttrGetter | null {
  const stringAttrDef = itemKey === "images" ? nodesImage : itemType === "nodes" ? nodesLabel : edgesLabel;

  let getLabel: StringAttrGetter | null = null;
  switch (stringAttrDef.type) {
    case "none":
      getLabel = () => null;
      break;
    case "fixed":
      getLabel = () => stringAttrDef.value;
      break;
    case "field":
      getLabel = (data: ItemData) => {
        const label = toString(data[stringAttrDef.field]);
        return typeof label === "string" ? label : stringAttrDef.missingValue;
      };
      break;
  }

  return getLabel;
}

export function getAllVisualGetters(dataset: GraphDataset, appearance: AppearanceState): VisualGetters {
  const nodeVisualGetters: VisualGetters = {
    getNodeSize: makeGetNumberAttr("nodes", "size", dataset, appearance),
    getNodeColor: makeGetColor("nodes", dataset, appearance),
    getNodeLabel: makeGetStringAttr("nodes", "labels", dataset, appearance),
    getNodeImage: makeGetStringAttr("nodes", "images", dataset, appearance),
    getEdgeSize: null,
    getEdgeColor: null,
    getEdgeLabel: null,
    getEdgeZIndex: null,
  };

  return {
    ...nodeVisualGetters,
    getEdgeSize: makeGetNumberAttr("edges", "size", dataset, appearance),
    getEdgeColor: makeGetColor("edges", dataset, appearance, nodeVisualGetters),
    getEdgeLabel: makeGetStringAttr("edges", "labels", dataset, appearance),
    getEdgeZIndex: makeGetNumberAttr("edges", "zIndex", dataset, appearance),
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
    if (getters.getNodeImage) attr.image = getters.getNodeImage(dataset.nodeData[node]);
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
    if (getters.getEdgeZIndex) attr.zIndex = getters.getEdgeZIndex(dataset.edgeData[edge]);
    graph.mergeEdgeAttributes(edge, attr);
  });
}

/**
 * Rendering helpers:
 */
export function getDrawNodeLabel<N extends Attributes, E extends Attributes, G extends Attributes>(
  { nodesLabelSize, nodesLabelEllipsis }: AppearanceState,
  draw: NodeLabelDrawingFunction<N, E, G>,
) {
  return ((context, data: CustomNodeDisplayData, settings) => {
    let labelSize =
      nodesLabelSize.type === "fixed"
        ? nodesLabelSize.value
        : ((data.rawSize as number) * nodesLabelSize.sizeCorrelation) / DEFAULT_NODE_LABEL_SIZE;
    if (nodesLabelSize.zoomCorrelation >= 1) labelSize = (labelSize * data.size) / data.rawSize;
    else if (nodesLabelSize.zoomCorrelation >= 0)
      labelSize = labelSize * Math.pow(data.size / data.rawSize, nodesLabelSize.zoomCorrelation);

    let nodeLabel = data.label;
    if (
      !data.highlighted &&
      data.label &&
      nodesLabelEllipsis.enabled &&
      data.label?.length > nodesLabelEllipsis.maxLength
    ) {
      nodeLabel = nodeLabel?.slice(0, nodesLabelEllipsis.maxLength) + "...";
    }

    return draw(
      context,
      {
        ...data,
        label: data.hideLabel ? null : nodeLabel,
      },
      { ...settings, labelSize, labelWeight: data.boldLabel ? "bold" : "normal" },
    );
  }) as NodeLabelDrawingFunction<N, E, G>;
}

export function getDrawEdgeLabel<N extends Attributes, E extends Attributes, G extends Attributes>(
  { edgesLabelSize, edgesLabelEllipsis }: AppearanceState,
  draw: EdgeLabelDrawingFunction<N, E, G>,
) {
  return ((context, data: CustomEdgeDisplayData, sourceData, targetData, settings) => {
    let edgeLabelSize =
      edgesLabelSize.type === "fixed" ? edgesLabelSize.value : data.rawSize * edgesLabelSize.sizeCorrelation;
    if (edgesLabelSize.zoomCorrelation >= 1) edgeLabelSize = (edgeLabelSize * data.size) / data.rawSize;
    else if (edgesLabelSize.zoomCorrelation >= 0)
      edgeLabelSize = edgeLabelSize * Math.pow(data.size / data.rawSize, edgesLabelSize.zoomCorrelation);

    let edgeLabel = data.label;
    if (data.label && edgesLabelEllipsis.enabled && data.label?.length > edgesLabelEllipsis.maxLength) {
      edgeLabel = edgeLabel?.slice(0, edgesLabelEllipsis.maxLength) + "...";
    }

    return draw(context, { ...data, label: edgeLabel }, sourceData, targetData, { ...settings, edgeLabelSize });
  }) as EdgeLabelDrawingFunction<N, E, G>;
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
