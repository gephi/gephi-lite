import { DataGraph, ItemData } from "../graph/types";
import { ItemType } from "../types";
import Graph from "graphology";

interface BaseMetricParameter {
  id: string;
  type: string;
  description?: boolean;
  required?: boolean;
  defaultValue?: unknown;
}

export interface MetricBooleanParameter extends BaseMetricParameter {
  type: "boolean";
  defaultValue: boolean;
}

export interface MetricNumberParameter extends BaseMetricParameter {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
}

export interface MetricEnumParameter extends BaseMetricParameter {
  type: "enum";
  values: { id: string }[];
  defaultValue: string;
}

export interface MetricAttributeParameter extends BaseMetricParameter {
  type: "attribute";
  itemType: ItemType;
  restriction?: "qualitative" | "quantitative";
}

type MetricScriptFunction = (id: string, attributes: ItemData, index: number, graph: Graph) => number;
export interface MetricScriptParameter extends BaseMetricParameter {
  type: "script";
  defaultValue: (id: string, attributes: ItemData, index: number, graph: Graph) => number;
  functionJsDoc: string;
  functionCheck: (fn?: MetricScriptFunction) => void;
}

export type MetricParameter =
  | MetricBooleanParameter
  | MetricNumberParameter
  | MetricEnumParameter
  | MetricAttributeParameter
  | MetricScriptParameter;

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
  description?: boolean;
  fn: (
    parameters: Record<string, unknown>,
    sigma: DataGraph,
  ) => { [Key in keyof Types]: Record<string, Types[Key]["type"]> };
}

export interface MetricReport {
  // TODO
}
