import { ItemType } from '../types';

export interface BaseFilter {
  type: string;
  itemType: ItemType;
}

export type RangeFilter = BaseFilter & {
  type: 'range';
  itemType: ItemType;
  field: string;
} & ({ min: number; max?: number } | { min?: number; max: number });

export interface TermsFilter extends BaseFilter {
  type: 'terms';
  itemType: ItemType;
  field: string;
  terms: Set<string>;
}

export interface TopologicalFilter extends BaseFilter {
  type: 'topological';
  itemType: ItemType;
  method: string; // TODO
  arguments: any; // TODO
}

export interface ScriptFilter extends BaseFilter {
  type: 'script';
  itemType: ItemType;
  script: (itemID: string) => boolean;
}

export type Filter = RangeFilter | TermsFilter | TopologicalFilter | ScriptFilter;

export interface FiltersState {
  past: Filter[];
  future: Filter[];
}
