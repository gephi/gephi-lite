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

export interface AppearanceState {
  nodesSize: Size;
  edgesSize: Size;
}
