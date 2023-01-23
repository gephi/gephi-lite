export interface FixedSize {
  type: "fixed";
  value: number;
}
export interface RankingSize {
  type: "ranking";
  field: string;
  min: number;
  max: number;
  transformationMethod?: { pow: number } | "log" | { spline: [[number, number], [number, number]] };
}
export type Size = RankingSize | FixedSize;

export interface FixedColor {
  type: "fixed";
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
}
export interface PartitionColor {
  type: "partition";
  field: string;
  colorPalette: Record<string, string>;
  missingColor: string;
}
export type Color = RankingColor | FixedColor | PartitionColor;

export interface AppearanceState {
  nodesSize: Size;
  edgesSize: Size;
  nodesColor: Color;
  edgesColor: Color;
}
