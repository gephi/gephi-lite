import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_EDGE_SIZE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_LABEL_SIZE,
  DEFAULT_NODE_SIZE,
  StaticDynamicItemData,
  toString,
} from "@gephi/gephi-lite-sdk";
import chroma from "chroma-js";
import { Attributes } from "graphology-types";
import { forEach, identity, isNil, keyBy } from "lodash";
import { EdgeLabelDrawingFunction, NodeLabelDrawingFunction } from "sigma/rendering";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";

import { mergeStaticDynamicData } from "../graph/dynamicAttributes";
import { getFieldValue, getFieldValueForQuantification } from "../graph/fieldModel";
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

export const makeTransformValue = (method?: TransformationMethod): ((value?: number) => number | undefined) => {
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
      if (!("minSize" in numberAttrDef)) {
        getNumberValue = (data: StaticDynamicItemData) => {
          const valueAsNumber = getFieldValueForQuantification(data, numberAttrDef.field);
          return valueAsNumber ?? numberAttrDef.missingSize;
        };
      } else {
        const minSize = numberAttrDef.minSize as number;
        const maxSize = numberAttrDef.maxSize as number;

        const transformValue = makeTransformValue(numberAttrDef.transformationMethod);
        let min = Infinity,
          max = -Infinity;
        forEach(itemsValues, (data) => {
          const valueAsNumber = getFieldValueForQuantification(data, numberAttrDef.field);
          const transformedValue = transformValue(valueAsNumber);
          if (typeof transformedValue === "number") {
            min = Math.min(min, transformedValue);
            max = Math.max(max, transformedValue);
          }
        });
        const delta = max - min || 1;
        const ratio = (maxSize - minSize) / delta;
        getNumberValue = (data: StaticDynamicItemData) => {
          const valueAsNumber = getFieldValueForQuantification(data, numberAttrDef.field);
          const transformedValue = transformValue(valueAsNumber);

          if (
            typeof transformedValue === "number" &&
            !isNaN(transformedValue) &&
            Math.abs(transformedValue) !== Infinity
          ) {
            return (transformedValue - min) * ratio + minSize;
          }
          return numberAttrDef.missingSize;
        };
      }
      break;
    }
    case "field": {
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const valueAsNumber = getFieldValueForQuantification(data, numberAttrDef.field);
        if (typeof valueAsNumber === "number") {
          min = Math.min(min, valueAsNumber);
          max = Math.max(max, valueAsNumber);
        }
      });
      const [minIndex, maxIndex] = numberAttrDef.reversed ? [10, 1] : [1, 10];
      const delta = max - min || 1;
      const ratio = (maxIndex - minIndex) / delta;
      getNumberValue = (data: StaticDynamicItemData) => {
        const valueAsNumber = getFieldValueForQuantification(data, numberAttrDef.field);

        if (typeof valueAsNumber === "number" && !isNaN(valueAsNumber) && Math.abs(valueAsNumber) !== Infinity) {
          return (valueAsNumber - min) * ratio + minIndex;
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
  { nodeData, edgeData, fullGraph }: GraphDataset,
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
    case "field":
      getColor = (data: StaticDynamicItemData) => {
        const castValue = getFieldValue(data, colorsDef.field) as string | undefined;
        return !isNil(castValue) ? castValue : colorsDef.missingColor;
      };
      break;
    case "partition":
      getColor = (data: StaticDynamicItemData) => {
        const valueAsString = getFieldValue(data, colorsDef.field) + "";
        return valueAsString in colorsDef.colorPalette ? colorsDef.colorPalette[valueAsString] : colorsDef.missingColor;
      };
      break;
    case "ranking": {
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const valueAsNumber = getFieldValueForQuantification(data, colorsDef.field);
        if (typeof valueAsNumber === "number") {
          min = Math.min(min, valueAsNumber);
          max = Math.max(max, valueAsNumber);
        }
      });
      const delta = max - min || 1;
      const colorScale = chroma
        .scale(colorsDef.colorScalePoints.map((point) => point.color))
        .domain(colorsDef.colorScalePoints.map((csp) => csp.scalePoint));
      getColor = (data: StaticDynamicItemData) => {
        const valueAsNumber = getFieldValueForQuantification(data, colorsDef.field);
        if (typeof valueAsNumber === "number") {
          return colorScale((valueAsNumber - min) / delta).hex();
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
    } else {
      getColor = () => DEFAULT_EDGE_COLOR;
    }
  }

  if (getColor && shadingDef) {
    let min = Infinity,
      max = -Infinity;
    forEach(itemsValues, (data) => {
      const valueAsNumber = getFieldValueForQuantification(data, shadingDef.field);
      if (typeof valueAsNumber === "number") {
        min = Math.min(min, valueAsNumber);
        max = Math.max(max, valueAsNumber);
      }
    });
    const factor = shadingDef.factor / (max - min || 1);

    const rawGetColor = getColor;
    getColor = (data: StaticDynamicItemData, edgeId?: string) => {
      const color = rawGetColor(data, edgeId);
      const valueAsNumber = getFieldValueForQuantification(data, shadingDef.field);

      if (typeof valueAsNumber === "number") {
        return chroma
          .scale([color, shadingDef.targetColor])(
            valueAsNumber === max ? shadingDef.factor : (valueAsNumber - min) * factor,
          )
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
      // using "" instead of null to workaround adge-node labels dependency see https://github.com/jacomyal/sigma.js/issues/1527
      getLabel = () => "";
      break;
    case "fixed":
      getLabel = () => stringAttrDef.value;
      break;
    case "field":
      getLabel = (data) => {
        const label = toString(
          stringAttrDef.field.dynamic ? data.dynamic[stringAttrDef.field.id] : data.static[stringAttrDef.field.id],
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
    const nodeData = {
      static: dataset.nodeData[node] || {},
      dynamic: dynamicItemData.dynamicNodeData[node],
    };
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
      static: dataset.edgeData[edge] || {},
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
  const getLabel = type === "nodes" ? visualGetters.getNodeLabel : visualGetters.getEdgeLabel;
  const getColor = type === "nodes" ? visualGetters.getNodeColor : visualGetters.getEdgeColor;
  const defaultColor = type === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
  const hidden = type === "nodes" ? !filteredGraph.hasNode(id) : !filteredGraph.hasEdge(id);

  return {
    label: (getLabel && getLabel(itemData)) || undefined,
    color: (getColor && getColor(itemData, id)) || defaultColor,
    hidden,
    directed: type === "edges" ? graphDataset.fullGraph.isDirected(id) : undefined,
  };
}

export function inferAppearanceState(graphDataset: GraphDataset): Partial<AppearanceState> {
  const appearanceState: Partial<AppearanceState> = {};

  const nodeFieldsDict = keyBy(graphDataset.nodeFields, "id");
  if (nodeFieldsDict["size"]?.type === "number")
    appearanceState.nodesSize = {
      type: "ranking",
      field: nodeFieldsDict["size"],
      missingSize: DEFAULT_NODE_SIZE,
    };
  if (nodeFieldsDict["label"]?.type === "text")
    appearanceState.nodesLabel = {
      type: "field",
      field: nodeFieldsDict["label"],
      missingValue: null,
    };
  if (nodeFieldsDict["color"]?.type === "color")
    appearanceState.nodesColor = {
      type: "field",
      field: nodeFieldsDict["color"],
      missingColor: DEFAULT_NODE_COLOR,
    };

  const edgeFieldsDict = keyBy(graphDataset.edgeFields, "id");
  if (edgeFieldsDict["weight"]?.type === "number")
    appearanceState.edgesSize = {
      type: "ranking",
      field: edgeFieldsDict["weight"],
      missingSize: DEFAULT_EDGE_SIZE,
    };
  if (edgeFieldsDict["label"]?.type === "text")
    appearanceState.edgesLabel = {
      type: "field",
      field: edgeFieldsDict["label"],
      missingValue: null,
    };
  if (edgeFieldsDict["color"]?.type === "color")
    appearanceState.edgesColor = {
      type: "field",
      field: edgeFieldsDict["color"],
      missingColor: DEFAULT_EDGE_COLOR,
    };

  return appearanceState;
}
