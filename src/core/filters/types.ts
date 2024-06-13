import { Parameter } from "../forms/types";
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

export interface TopologicalFilterType {
  type: "topological";
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arguments?: any; // TODO
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
 * Topological definition (to help building meaningful forms):
 * ***********************************************************
 */
export interface TopologicalFilterDefinition {
  id: string;
  description?: boolean;
  parameters: Parameter[];
  fn: (parameters: Record<string, unknown>, graph: FullGraph) => DatalessGraph;
}

/**
 * Filtering steps:
 * ****************
 */
export interface FilteredGraph {
  filterFingerprint: string;
  graph: DatalessGraph;
}
