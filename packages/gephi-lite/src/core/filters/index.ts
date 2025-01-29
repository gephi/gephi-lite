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

export const addFilter: Producer<FiltersState, [FilterType]> = (filter) => {
  return (state) => ({
    ...state,
    past: state.past.concat(filter),
  });
};

export const resetFilters: Producer<FiltersState> = () => {
  return () => getEmptyFiltersState();
};

export const openPastFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.past.length - 1))
      throw new Error(`openPastFilter: Index ${index} is out of bounds of past filters.`);

    return {
      ...state,
      past: state.past.slice(0, index + 1),
      future: state.past.slice(index + 1).concat(state.future),
    };
  };
};

export const openFutureFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.future.length))
      throw new Error(`openFutureFilter: Index ${index} is out of bounds of future filters.`);

    return {
      ...state,
      past: state.past.concat(state.future.slice(0, index + 1)),
      future: state.future.slice(index + 1),
    };
  };
};

export const openAllFutureFilters: Producer<FiltersState> = () => {
  return (state) => {
    return {
      ...state,
      past: state.past.concat(state.future),
      future: [],
    };
  };
};

export const closeAllPastFilters: Producer<FiltersState> = () => {
  return (state) => {
    return {
      ...state,
      past: [],
      future: state.past.concat(state.future),
    };
  };
};

export const deleteCurrentFilter: Producer<FiltersState> = () => {
  return (state) => {
    if (!state.past.length) throw new Error(`deleteCurrentFilter: There is not filter to delete.`);

    return {
      ...state,
      past: dropRight(state.past, 1),
    };
  };
};

export const deletePastFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.past.length))
      throw new Error(`deletePastFilter: Index ${index} is out of bounds of past filters.`);

    return {
      ...state,
      past: state.past.filter((_, i: number) => i !== index),
    };
  };
};

export const deleteFutureFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.future.length))
      throw new Error(`openFutureFilter: Index ${index} is out of bounds of future filters.`);

    return {
      ...state,
      future: state.future.filter((_, i: number) => i !== index),
    };
  };
};

export const replaceCurrentFilter: Producer<FiltersState, [FilterType]> = (filter) => {
  return (state) => ({
    ...state,
    past: dropRight(state.past, 1).concat(filter),
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
  openPastFilter: producerToAction(openPastFilter, filtersAtom),
  openFutureFilter: producerToAction(openFutureFilter, filtersAtom),
  openAllFutureFilters: producerToAction(openAllFutureFilters, filtersAtom),
  replaceCurrentFilter: producerToAction(replaceCurrentFilter, filtersAtom),
  deleteCurrentFilter: producerToAction(deleteCurrentFilter, filtersAtom),
  deletePastFilter: producerToAction(deletePastFilter, filtersAtom),
  deleteFutureFilter: producerToAction(deleteFutureFilter, filtersAtom),
  closeAllPastFilters: producerToAction(closeAllPastFilters, filtersAtom),
} as const;

/**
 * Bindings:
 * *********
 */
filtersAtom.bind((filtersState) => {
  sessionStorage.setItem("filters", serializeFiltersState(filtersState));
});
