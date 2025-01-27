import { ReactNode } from "react";

import { DatalessGraph, FullGraph, ItemData } from "../graph/types";
import { ItemType } from "../types";

export interface BaseFilter {
  type: string;
  itemType: ItemType;
}

export type RangeFilterType = BaseFilter & {
  type: "range";
  itemType: ItemType;
  field: string;
  keepMissingValues?: boolean;
} & { min?: number; max?: number };

export interface TermsFilterType extends BaseFilter {
  type: "terms";
  itemType: ItemType;
  field: string;
  terms?: Set<string>;
  keepMissingValues?: boolean;
}

export interface ScriptFilterType extends BaseFilter {
  type: "script";
  itemType: ItemType;
  script?: (itemID: string, attributes: ItemData, fullGraph: FullGraph) => boolean;
}

export type FilterType = RangeFilterType | TermsFilterType | TopologicalFilterType | ScriptFilterType;

export interface FiltersState {
  past: FilterType[];
  future: FilterType[];
}

/**
 * Filtering steps:
 * ****************
 */
export interface FilteredGraph {
  filterFingerprint: string;
  graph: DatalessGraph;
}

/**
 * Topological filters
 * *******************
 */

interface BaseFilterParameter {
  id: string;
  type: string;
  label: string;
  required: boolean;
  defaultValue?: unknown;
  value?: unknown;
  hidden?: boolean;
}

export interface FilterBooleanParameter extends BaseFilterParameter {
  type: "boolean";
  defaultValue: boolean;
  value?: boolean;
}

export interface FilterNumberParameter extends BaseFilterParameter {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
  value?: number;
}

export interface FilterEnumParameter<E extends string> extends BaseFilterParameter {
  type: "enum";
  options: { value: E; label: string }[];
  defaultValue: E;
  value?: E;
}

export interface FilterNodeParameter extends BaseFilterParameter {
  type: "node";
  value?: string;
}

export type FilterParameter =
  | FilterBooleanParameter
  | FilterNumberParameter
  | FilterEnumParameter<string>
  | FilterNodeParameter;

export interface TopologicalFilterType<ParametersType extends FilterParameter[] = FilterParameter[]> {
  type: "topological";
  id: string;
  label: string;
  parameters: ParametersType;
  summary: (parameters: ParametersType) => ReactNode;
  filter: (parameters: ParametersType, graph: DatalessGraph) => DatalessGraph;
}

// largest connected components
// arguments number

// connected components by size
// arguments minimumsize number

// degree
// k-core
// ego-network
// shortest path
