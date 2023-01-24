interface StaticSize<T extends string> {
  type: T;
  field?: undefined;
}
export type DataSize = StaticSize<"data">;
export interface FixedSize extends StaticSize<"fixed"> {
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

interface StaticColor<T extends string> {
  type: T;
  field?: undefined;
}
export type DataColor = StaticColor<"data">;
export type SourceNodeColor = StaticColor<"source">;
export type TargetNodeColor = StaticColor<"target">;
export interface FixedColor extends StaticColor<"fixed"> {
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

export interface AppearanceState {
  nodesSize: Size;
  edgesSize: Size;
  nodesColor: Color;
  edgesColor: EdgeColor;
}
