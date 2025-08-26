import { DatalessGraph, FieldModel, FullGraph, ItemData, ItemType } from "../graph";

export interface BaseFilter {
  type: string;
  itemType: ItemType;
  field: FieldModel;
  disabled?: boolean;
}

export type RangeFilterType = BaseFilter & {
  type: "range";
  itemType: ItemType;
  keepMissingValues?: boolean;
} & { min?: number; max?: number };

export interface TermsFilterType extends BaseFilter {
  type: "terms";
  itemType: ItemType;
  terms?: Set<string>;
  keepMissingValues?: boolean;
}

export interface ScriptFilterType extends Omit<BaseFilter, "field"> {
  type: "script";
  script?: (itemID: string, attributes: ItemData, fullGraph: FullGraph) => boolean;
}

export interface TopologicalFilterType extends Omit<BaseFilter, "itemType" | "field"> {
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
  filters: FilterType[];
}
