interface NoFieldValue<T extends string> {
  type: T;
  field?: undefined;
}

// Sizes management:
export type DataSize = NoFieldValue<"data">;
export interface FixedSize extends NoFieldValue<"fixed"> {
  value: number;
}
export interface RankingSize {
  type: "ranking";
  field: string;
  minSize: number;
  maxSize: number;
  transformationMethod?: { pow: number } | "log" | { spline: [[number, number], [number, number]] };
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

export type FixedLabelSize = NoFieldValue<"fixed"> & { value: number };
export type ItemLabelSize = NoFieldValue<"item"> & { coef: number; adaptsToZoom: boolean };
export type LabelSize = FixedLabelSize | ItemLabelSize;

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
