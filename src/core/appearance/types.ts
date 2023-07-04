import { EdgeDisplayData, NodeDisplayData } from "sigma/types";

import { ItemData } from "../graph/types";

interface NoFieldValue<T extends string> {
  type: T;
  field?: undefined;
}

// Sizes management:
export type DataSize = NoFieldValue<"data">;
export interface FixedSize extends NoFieldValue<"fixed"> {
  value: number;
}

export type TransformationMethod = { pow: number } | "log" | { spline: [[number, number], [number, number]] };

export interface RankingSize {
  type: "ranking";
  field: string;
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
export interface RankingColor {
  type: "ranking";
  field: string;
  colorScalePoints: ColorScalePointType[];
  transformationMethod?: { pow: number } | "log" | { spline: [[number, number], [number, number]] };
  missingColor: string;
}
export interface PartitionColor {
  type: "partition";
  field: string;
  colorPalette: Record<string, string>;
  missingColor: string;
}
export type Color = DataColor | RankingColor | FixedColor | PartitionColor;
export type EdgeColor = Color | SourceNodeColor | TargetNodeColor;

// Labels management:
export type NoLabel = NoFieldValue<"none">;
export type DataLabel = NoFieldValue<"data">;
export type FixedLabel = NoFieldValue<"fixed"> & { value: string };
export interface FieldLabel {
  type: "field";
  field: string;
  missingLabel: string | null;
}
export type Label = NoLabel | DataLabel | FixedLabel | FieldLabel;

export type BaseLabelSize = { density: number; zoomCorrelation: number };
export type FixedLabelSize = NoFieldValue<"fixed"> & BaseLabelSize & { value: number };
export type ItemLabelSize = NoFieldValue<"item"> & BaseLabelSize & { sizeCorrelation: number };
export type LabelSize = FixedLabelSize | ItemLabelSize;

/**
 * This state contains everything needed to generate the visual getters:
 */
export interface AppearanceState {
  showEdges: boolean;
  nodesSize: Size;
  edgesSize: Size;
  nodesColor: Color;
  edgesColor: EdgeColor;
  nodesLabel: Label;
  edgesLabel: Label;
  nodesLabelSize: LabelSize;
  edgesLabelSize: LabelSize;
}

export type SizeGetter = (data: ItemData) => number;
export type ColorGetter = (data: ItemData, edgeId?: string) => string;
export type LabelGetter = (data: ItemData) => string | null;

/**
 * This state contains the visual getters, i.e. the functions to get a node or
 * edge size, color or label:
 */
export interface VisualGetters {
  getNodeSize: SizeGetter | null;
  getNodeColor: ColorGetter | null;
  getNodeLabel: LabelGetter | null;
  getEdgeSize: SizeGetter | null;
  getEdgeColor: ColorGetter | null;
  getEdgeLabel: LabelGetter | null;
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
