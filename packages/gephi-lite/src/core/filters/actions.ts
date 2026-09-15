import { FilterType, FiltersState, getEmptyFiltersState } from "@gephi/gephi-lite-sdk";
import { Producer, producerToAction } from "@ouestware/atoms";
import { inRange } from "lodash";

import { filtersAtom } from "./atom";

const setFilters: Producer<FiltersState, [FiltersState]> = (filters) => {
  return () => filters;
};

const addFilter: Producer<FiltersState, [FilterType, number?]> = (filter, at) => {
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

const resetFilters: Producer<FiltersState> = () => {
  return () => getEmptyFiltersState();
};

const deleteFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.filters.length))
      throw new Error(`deletePastFilter: Index ${index} is out of bounds of past filters.`);

    return {
      ...state,
      filters: state.filters.filter((_, i: number) => i !== index),
    };
  };
};

const updateFilter: Producer<FiltersState, [number, FilterType]> = (index, newFilter) => {
  return (state) => ({
    ...state,
    filters: state.filters.map((filter, i) => (i === index ? newFilter : filter)),
  });
};

const disableFiltersFrom: Producer<FiltersState, [number]> = (index) => {
  return (state) => ({
    ...state,
    filters: state.filters.map((filter, i) => (i >= index ? { ...filter, disabled: true } : filter)),
  });
};

export const filtersActions = {
  setFilters: producerToAction(setFilters, filtersAtom),
  addFilter: producerToAction(addFilter, filtersAtom),
  resetFilters: producerToAction(resetFilters, filtersAtom),
  updateFilter: producerToAction(updateFilter, filtersAtom),
  deleteFilter: producerToAction(deleteFilter, filtersAtom),
  disableFiltersFrom: producerToAction(disableFiltersFrom, filtersAtom),
} as const;
