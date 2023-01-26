import { DataGraph } from "../graph/types";
import { ItemType } from "../types";

export interface MetricBooleanParameter {
  id: string;
  type: "boolean";
  required?: boolean;
  defaultValue?: boolean;
}

export interface MetricNumberParameter {
  id: string;
  type: "number";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface MetricEnumParameter {
  id: string;
  type: "enum";
  required?: boolean;
  values: { id: string }[];
  defaultValue?: string;
}

export interface MetricAttributeParameter {
  id: string;
  type: "attribute";
  required?: boolean;
  itemType: ItemType;
  restriction?: "quali" | "quanti";
}

export type MetricParameter =
  | MetricBooleanParameter
  | MetricNumberParameter
  | MetricEnumParameter
  | MetricAttributeParameter;

export type MetricType =
  | { string: "number"; type: number }
  | { string: "string"; type: string }
  | { string: "boolean"; type: boolean };

export interface Metric<
  Items extends ItemType,
  Keys extends [string, ...string[]],
  Types extends Record<Keys[number], MetricType>,
> {
  id: string;
  types: { [Key in keyof Types]: Types[Key]["string"] };
  itemType: Items;
  parameters: MetricParameter[];
  metric: (parameters: Record<string, unknown>, sigma: DataGraph) => { [Key in keyof Types]: Types[Key]["type"] };
}
