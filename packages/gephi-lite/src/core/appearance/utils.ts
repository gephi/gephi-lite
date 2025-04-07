import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_LABEL_SIZE,
  StaticDynamicItemData,
  toNumber,
  toString,
} from "@gephi/gephi-lite-sdk";
import chroma from "chroma-js";
import { Attributes } from "graphology-types";
import { forEach, identity } from "lodash";
import { EdgeLabelDrawingFunction, NodeLabelDrawingFunction } from "sigma/rendering";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";

import { getFieldValue, mergeStaticDynamicData } from "../graph/dynamicAttributes";
import {
  DatalessGraph,
  DynamicItemData,
  EdgeRenderingData,
  GraphDataset,
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
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_EDGE_COLOR,
  DEFAULT_EDGE_LABEL_SIZE,
  DEFAULT_EDGE_SIZE,
  DEFAULT_LAYOUT_GRID_COLOR,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_LABEL_SIZE,
  DEFAULT_NODE_SIZE,
  DEFAULT_SHADING_COLOR,
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
  { dynamicNodeData, dynamicEdgeData }: DynamicItemData,
  { nodesSize, edgesSize, edgesZIndex }: AppearanceState,
): null | NumberGetter {
  const numberAttrDef = itemKey === "zIndex" ? edgesZIndex : itemType === "nodes" ? nodesSize : edgesSize;
  const itemsValues =
    itemType === "nodes"
      ? mergeStaticDynamicData(nodeData, dynamicNodeData)
      : mergeStaticDynamicData(edgeData, dynamicEdgeData);

  let getNumberValue: NumberGetter | null = null;
  switch (numberAttrDef.type) {
    case "ranking": {
      const getValue = makeGetValue(numberAttrDef.transformationMethod);
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = getValue(toNumber(getFieldValue(data, numberAttrDef.field)));
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const delta = max - min || 1;
      const ratio = (numberAttrDef.maxSize - numberAttrDef.minSize) / delta;
      getNumberValue = (data: StaticDynamicItemData) => {
        const value = getValue(toNumber(getFieldValue(data, numberAttrDef.field)));

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
        const value = toNumber(getFieldValue(data, numberAttrDef.field));
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const [minIndex, maxIndex] = numberAttrDef.reversed ? [10, 1] : [1, 10];
      const delta = max - min || 1;
      const ratio = (maxIndex - minIndex) / delta;
      getNumberValue = (data: StaticDynamicItemData) => {
        const value = toNumber(getFieldValue(data, numberAttrDef.field));

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
  { dynamicNodeData, dynamicEdgeData }: DynamicItemData,
  { nodesColor, edgesColor, nodesShadingColor, edgesShadingColor }: AppearanceState,
  getters?: VisualGetters,
): ColorGetter | null {
  const itemsValues = mergeStaticDynamicData(
    itemType === "nodes" ? nodeData : edgeData,
    itemType === "nodes" ? dynamicNodeData : dynamicEdgeData,
  );
  const colorsDef = itemType === "nodes" ? nodesColor : edgesColor;
  const shadingDef = itemType === "nodes" ? nodesShadingColor : edgesShadingColor;

  let getColor: ColorGetter | null = null;
  switch (colorsDef.type) {
    case "partition":
      getColor = (data: StaticDynamicItemData) => {
        const value = getFieldValue(data, colorsDef.field) as string;
        return value in colorsDef.colorPalette ? colorsDef.colorPalette[value] : colorsDef.missingColor;
      };
      break;
    case "ranking": {
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = toNumber(getFieldValue(data, colorsDef.field));
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const delta = max - min || 1;
      const colorScale = chroma
        .scale(colorsDef.colorScalePoints.map((point) => point.color))
        .domain(colorsDef.colorScalePoints.map((csp) => csp.scalePoint));
      getColor = (data: StaticDynamicItemData) => {
        const value = toNumber(getFieldValue(data, colorsDef.field));
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

    if (getNodeColor) {
      const nodesValues = mergeStaticDynamicData(nodeData, dynamicNodeData);
      getColor = (_, edgeId?: string) => {
        const node = nodeForColor(edgeId);
        return node ? getNodeColor(nodesValues[node]) : DEFAULT_NODE_COLOR;
      };
    } else if (nodesColor.type === "data") {
      // special case when node are colored by data have to reach nodeRenderingData instead of normal getNodeColor
      getColor = (_, edgeId?: string) => {
        const node = nodeForColor(edgeId);
        return node && nodeRenderingData[node] && nodeRenderingData[node].color
          ? nodeRenderingData[node].color || DEFAULT_NODE_COLOR
          : DEFAULT_NODE_COLOR;
      };
    } else {
      getColor = () => DEFAULT_EDGE_COLOR;
    }
  }

  if (getColor && shadingDef) {
    let min = Infinity,
      max = -Infinity;
    forEach(itemsValues, (data) => {
      const value = toNumber(getFieldValue(data, shadingDef.field));
      if (typeof value === "number") {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });
    const factor = shadingDef.factor / (max - min || 1);

    const rawGetColor = getColor;
    getColor = (data: StaticDynamicItemData, edgeId?: string) => {
      const color = rawGetColor(data, edgeId);
      const value = toNumber(getFieldValue(data, shadingDef.field));

      if (typeof value === "number") {
        return chroma
          .scale([color, shadingDef.targetColor])(value === max ? shadingDef.factor : (value - min) * factor)
          .hex();
      }

      return shadingDef.missingColor || color;
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
      getLabel = (data) => {
        const label = toString(
          stringAttrDef.field.dynamic
            ? data.dynamic[stringAttrDef.field.field]
            : data.static[stringAttrDef.field.field],
        );
        return typeof label === "string" ? label : stringAttrDef.missingValue;
      };
      break;
  }

  return getLabel;
}

export function getAllVisualGetters(
  dataset: GraphDataset,
  dynamicNodeData: DynamicItemData,
  appearance: AppearanceState,
): VisualGetters {
  const nodeVisualGetters: VisualGetters = {
    getNodeSize: makeGetNumberAttr("nodes", "size", dataset, dynamicNodeData, appearance),
    getNodeColor: makeGetColor("nodes", dataset, dynamicNodeData, appearance),
    getNodeLabel: makeGetStringAttr("nodes", "labels", dataset, appearance),
    getNodeImage: makeGetStringAttr("nodes", "images", dataset, appearance),
    getEdgeSize: null,
    getEdgeColor: null,
    getEdgeLabel: null,
    getEdgeZIndex: null,
  };

  return {
    ...nodeVisualGetters,
    getEdgeSize: makeGetNumberAttr("edges", "size", dataset, dynamicNodeData, appearance),
    getEdgeColor: makeGetColor("edges", dataset, dynamicNodeData, appearance, nodeVisualGetters),
    getEdgeLabel: makeGetStringAttr("edges", "labels", dataset, appearance),
    getEdgeZIndex: makeGetNumberAttr("edges", "zIndex", dataset, dynamicNodeData, appearance),
  };
}
export function applyVisualProperties(
  graph: SigmaGraph,
  dataset: GraphDataset,
  dynamicItemData: DynamicItemData,
  getters: VisualGetters,
): void {
  graph.forEachNode((node) => {
    const nodeData = { static: dataset.nodeData[node], dynamic: dynamicItemData.dynamicNodeData[node] };
    const attr: Partial<NodeRenderingData> = {};
    if (getters.getNodeSize) {
      attr.size = getters.getNodeSize(nodeData);
      // store raw size to compute label size independent to zoom
      attr.rawSize = attr.size;
    }
    if (getters.getNodeColor) attr.color = getters.getNodeColor(nodeData);
    if (getters.getNodeLabel) attr.label = getters.getNodeLabel(nodeData);
    if (getters.getNodeImage) attr.image = getters.getNodeImage(nodeData);
    graph.mergeNodeAttributes(node, attr);
  });

  graph.forEachEdge((edge) => {
    const edgeData = {
      static: dataset.edgeData[edge],
      dynamic: dynamicItemData.dynamicEdgeData[edge],
    };
    const attr: Partial<EdgeRenderingData> = {};
    if (getters.getEdgeSize) {
      attr.weight = getters.getEdgeSize(edgeData);
      // store raw weight to compute label size independent to zoom
      attr.rawWeight = attr.weight;
    }
    if (getters.getEdgeColor) attr.color = getters.getEdgeColor(edgeData, edge);
    if (getters.getEdgeLabel) attr.label = getters.getEdgeLabel(edgeData);
    if (getters.getEdgeZIndex) attr.zIndex = getters.getEdgeZIndex(edgeData);
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
  itemData: StaticDynamicItemData,
  graphDataset: GraphDataset,
  visualGetters: VisualGetters,
): { label: string | undefined; color: string; hidden?: boolean; directed?: boolean } {
  const renderingData = type === "nodes" ? graphDataset.nodeRenderingData[id] : graphDataset.edgeRenderingData[id];
  const getLabel = type === "nodes" ? visualGetters.getNodeLabel : visualGetters.getEdgeLabel;
  const getColor = type === "nodes" ? visualGetters.getNodeColor : visualGetters.getEdgeColor;
  const defaultColor = type === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
  const hidden = type === "nodes" ? !filteredGraph.hasNode(id) : !filteredGraph.hasEdge(id);

  return {
    label: (getLabel ? getLabel(itemData) : renderingData.label) || undefined,
    color: getColor ? getColor(itemData, id) : renderingData.color || defaultColor,
    hidden,
    directed: graphDataset.metadata.type !== "undirected",
  };
}
