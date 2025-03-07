import { EdgeDisplayData, NodeDisplayData } from "sigma/types";

import { ItemDataField, ItemType, StaticDynamicItemData } from "../graph";

interface AppearanceBaseElement {
  field?: ItemDataField;
}

interface NoFieldValue<T extends string> extends AppearanceBaseElement {
  type: T;
  field?: undefined;
}

// Sizes management:
export type DataSize = NoFieldValue<"data">;
export interface FixedSize extends NoFieldValue<"fixed"> {
  value: number;
}

export type TransformationMethod = { pow: number } | "log" | { spline: [[number, number], [number, number]] };

export interface RankingSize extends AppearanceBaseElement {
  type: "ranking";
  field: ItemDataField;
  minSize: number;
  maxSize: number;
  transformationMethod?: TransformationMethod;
  missingSize: number;
}
export type Size = DataSize | RankingSize | FixedSize;

// Colors management:
export type DataColor = NoFieldValue<"data">;
export type SourceNodeColor = NoFieldValue<"source">;
export type TargetNodeColor = NoFieldValue<"target">;
export interface FixedColor extends NoFieldValue<"fixed"> {
  value: string;
}
export interface ColorScalePointType {
  scalePoint: number;
  color: string;
}
export interface RankingColor extends AppearanceBaseElement {
  type: "ranking";
  field: ItemDataField;
  colorScalePoints: ColorScalePointType[];
  transformationMethod?: { pow: number } | "log" | { spline: [[number, number], [number, number]] };
  missingColor: string;
}
export interface PartitionColor extends AppearanceBaseElement {
  type: "partition";
  field: ItemDataField;
  colorPalette: Record<string, string>;
  missingColor: string;
}
export interface ShadingColor extends AppearanceBaseElement {
  type: "shading";
  field: ItemDataField;
  factor: number;
  targetColor: string;
  missingColor?: string;
}
export type Color = DataColor | RankingColor | FixedColor | PartitionColor;
export type EdgeColor = Color | SourceNodeColor | TargetNodeColor;

// Labels management:
export type NoStringAttr = NoFieldValue<"none">;
export type DataStringAttr = NoFieldValue<"data">;
export type FixedStringAttr = NoFieldValue<"fixed"> & { value: string };
export interface FieldStringAttr extends AppearanceBaseElement {
  type: "field";
  field: ItemDataField;
  missingValue: string | null;
}
export type StringAttr = NoStringAttr | DataStringAttr | FixedStringAttr | FieldStringAttr;

export type BaseLabelSize = { density: number; zoomCorrelation: number };
export type FixedLabelSize = NoFieldValue<"fixed"> & BaseLabelSize & { value: number };
export type ItemLabelSize = NoFieldValue<"item"> & BaseLabelSize & { sizeCorrelation: number };
export type LabelSize = FixedLabelSize | ItemLabelSize;
export type LabelEllipsis = NoFieldValue<"ellipsis"> & { enabled: boolean; maxLength: number };

export interface BooleanAppearance extends AppearanceBaseElement {
  value: boolean;
}

// Z-index management:
export interface ZIndexFieldAttr extends AppearanceBaseElement {
  type: "field";
  field: ItemDataField;
  reversed: boolean;
}

export type ZIndexAttr = NoFieldValue<"none"> | ZIndexFieldAttr;

/**
 * Describes how each visual variable should be used to render the graph in Gephi Lite.
 */

export interface AppearanceState {
  showEdges: BooleanAppearance;
  nodesSize: Size;
  edgesSize: Size;
  backgroundColor: string;
  layoutGridColor: string;
  nodesColor: Color;
  nodesShadingColor?: ShadingColor;
  edgesColor: EdgeColor;
  edgesShadingColor?: ShadingColor;
  nodesLabel: StringAttr;
  edgesLabel: StringAttr;
  nodesLabelSize: LabelSize;
  edgesLabelSize: LabelSize;
  nodesLabelEllipsis: LabelEllipsis;
  edgesLabelEllipsis: LabelEllipsis;
  nodesImage: StringAttr;
  edgesZIndex: ZIndexAttr;
}

export const APPEARANCE_ITEM_TYPES: Record<keyof AppearanceState, ItemType | null> = {
  backgroundColor: null,
  layoutGridColor: null,

  nodesSize: "nodes",
  nodesColor: "nodes",
  nodesShadingColor: "nodes",
  nodesLabel: "nodes",
  nodesLabelSize: "nodes",
  nodesLabelEllipsis: "nodes",
  nodesImage: "nodes",

  showEdges: "edges",
  edgesSize: "edges",
  edgesColor: "edges",
  edgesShadingColor: "edges",
  edgesLabel: "edges",
  edgesLabelSize: "edges",
  edgesLabelEllipsis: "edges",
  edgesZIndex: "edges",
};

export type NumberGetter = (data: StaticDynamicItemData) => number;
export type ColorGetter = (data: StaticDynamicItemData, edgeId?: string) => string;
export type StringAttrGetter = (data: StaticDynamicItemData) => string | null;

/**
 * This state contains the visual getters, i.e. the functions to get a node or
 * edge size, color or label:
 */
export interface VisualGetters {
  getNodeSize: NumberGetter | null;
  getNodeColor: ColorGetter | null;
  getNodeLabel: StringAttrGetter | null;
  getNodeImage: StringAttrGetter | null;
  getEdgeSize: NumberGetter | null;
  getEdgeColor: ColorGetter | null;
  getEdgeLabel: StringAttrGetter | null;
  getEdgeZIndex: NumberGetter | null;
}

/**
 * This types override RenderingData from sigma, with additional attributes used
 * in Gephi Lite:
 */
export type CustomNodeDisplayData = NodeDisplayData & {
  rawSize: number;
  borderColor?: string;
  hideLabel?: boolean;
  fixed?: boolean;
  boldLabel?: boolean;
};
export type CustomEdgeDisplayData = EdgeDisplayData & {
  rawSize: number;
};
