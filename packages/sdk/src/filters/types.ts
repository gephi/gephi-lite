import { DatalessGraph, FullGraph, ItemData, ItemType } from "../graph";

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

export interface TopologicalFilterType extends Omit<BaseFilter, "itemType"> {
  type: "topological";
  topologicalFilterId: string;
  parameters: unknown[];
}

export type FilterType = RangeFilterType | TermsFilterType | TopologicalFilterType | ScriptFilterType;

export interface FilteredGraph {
  filterFingerprint: string;
  graph: DatalessGraph;
}

export interface FiltersState {
  past: FilterType[];
  future: FilterType[];
}
