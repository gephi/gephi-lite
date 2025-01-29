import { ReactNode } from "react";

import { DatalessGraph } from "../graph/types";

export {
  type BaseFilter,
  type RangeFilterType,
  type TermsFilterType,
  type ScriptFilterType,
  type TopologicalFilterType,
  type FilterType,
  type FiltersState,
  type FilteredGraph,
} from "@gephi/gephi-lite-sdk";

/**
 * Topological filters definitions
 * *******************************
 */
interface BaseFilterParameter {
  id: string;
  type: string;
  label: string;
  required: boolean;
  defaultValue?: unknown;
  hidden?: boolean;
}

export interface FilterBooleanParameter extends BaseFilterParameter {
  type: "boolean";
  defaultValue: boolean;
}

export interface FilterNumberParameter extends BaseFilterParameter {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
}

export interface FilterEnumParameter<E extends string> extends BaseFilterParameter {
  type: "enum";
  options: { value: E; label: string }[];
  defaultValue: E;
}

export interface FilterNodeParameter extends BaseFilterParameter {
  type: "node";
}

export type FilterParameter =
  | FilterBooleanParameter
  | FilterNumberParameter
  | FilterEnumParameter<string>
  | FilterNodeParameter;

export type FilterParameterValueArray<P extends readonly FilterParameter[]> = {
  [I in keyof P]: P[I]["defaultValue"];
};

export interface TopologicalFilterDefinition<ParametersType extends FilterParameter[] = FilterParameter[]> {
  type: "topological";
  id: string;
  label: string;
  parameters: ParametersType;
  summary: (parameters: FilterParameterValueArray<ParametersType>) => ReactNode;
  filter: (parameters: FilterParameterValueArray<ParametersType>, graph: DatalessGraph) => DatalessGraph;
}

// largest connected components
// arguments number

// connected components by size
// arguments minimumsize number

// degree
// k-core
// ego-network
// shortest path
