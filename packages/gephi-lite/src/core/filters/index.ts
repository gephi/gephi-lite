import { Producer, atom, producerToAction } from "@ouestware/atoms";
import { dropRight, inRange } from "lodash";

import { FilterType, FiltersState } from "./types";
import { getEmptyFiltersState, serializeFiltersState } from "./utils";

/**
 * Producers:
 * **********
 */
export const setFilters: Producer<FiltersState, [FiltersState]> = (filters) => {
  return () => filters;
};

export const addFilter: Producer<FiltersState, [FilterType, number?]> = (filter, at) => {
  return (state) => {
    const filters = state.filters.slice(0);
    if (at === undefined) {
      filters.push(filter);
    } else {
      filters.splice(at, 0, filter);
    }
    return {
      ...state,
      filters,
    };
  };
};

export const resetFilters: Producer<FiltersState> = () => {
  return () => getEmptyFiltersState();
};

export const deleteCurrentFilter: Producer<FiltersState> = () => {
  return (state) => {
    if (!state.filters.length) throw new Error(`deleteCurrentFilter: There is not filter to delete.`);

    return {
      ...state,
      filters: dropRight(state.filters, 1),
    };
  };
};

export const deleteFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.filters.length))
      throw new Error(`deletePastFilter: Index ${index} is out of bounds of past filters.`);

    return {
      ...state,
      filters: state.filters.filter((_, i: number) => i !== index),
    };
  };
};

export const updateFilter: Producer<FiltersState, [number, FilterType]> = (index, newFilter) => {
  return (state) => ({
    ...state,
    filters: state.filters.map((filter, i) => (i === index ? newFilter : filter)),
  });
};

export const disableFiltersFrom: Producer<FiltersState, [number]> = (index) => {
  return (state) => ({
    ...state,
    filters: state.filters.map((filter, i) => (i >= index ? { ...filter, disabled: true } : filter)),
  });
};

/**
 * Public API:
 * ***********
 */
export const filtersAtom = atom<FiltersState>(getEmptyFiltersState());

export const filtersActions = {
  setFilters: producerToAction(setFilters, filtersAtom),
  addFilter: producerToAction(addFilter, filtersAtom),
  resetFilters: producerToAction(resetFilters, filtersAtom),
  updateFilter: producerToAction(updateFilter, filtersAtom),
  deleteFilter: producerToAction(deleteFilter, filtersAtom),
  disableFiltersFrom: producerToAction(disableFiltersFrom, filtersAtom),
} as const;

/**
 * Bindings:
 * *********
 */
filtersAtom.bind((filtersState) => {
  sessionStorage.setItem("filters", serializeFiltersState(filtersState));
});
