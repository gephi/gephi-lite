import { ComponentType } from "react";

import { FieldModel, FullGraph, ItemData } from "../graph/types";
import { ItemType, Scalar } from "../types";

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

export type MetricScriptFunction = (id: string, attributes: ItemData, index: number, graph: FullGraph) => Scalar;
export interface MetricScriptParameter extends BaseMetricParameter {
  type: "script";
  defaultValue: MetricScriptFunction;
  functionJsDoc: string;
  functionCheck: (fn?: MetricScriptFunction) => void;
}

export type MetricParameter =
  | MetricBooleanParameter
  | MetricNumberParameter
  | MetricEnumParameter
  | MetricAttributeParameter
  | MetricScriptParameter;

export type MetricType = { string: "qualitative"; type: string | boolean } | { string: "quantitative"; type: number };

export interface Metric<Outputs extends Partial<Record<ItemType, string[]>>> {
  id: string;
  outputs: {
    [Key in keyof Outputs]: Outputs[Key] extends string[]
      ? Record<Outputs[Key][number], Pick<FieldModel, "qualitative" | "quantitative"> | undefined>
      : never;
  };
  parameters: MetricParameter[];
  description?: boolean;
  fn: (
    parameters: Record<string, unknown>,
    graph: FullGraph,
  ) => {
    [Key in keyof Outputs]: Outputs[Key] extends string[]
      ? Record<Outputs[Key][number], Record<string, Scalar>>
      : never;
  };
  additionalControl?: ComponentType<{
    parameters: Record<string, unknown>;
    attributeNames: Record<string, unknown>;
    submitCount: number;
  }>;
}

export interface MetricReport {
  // TODO
}
