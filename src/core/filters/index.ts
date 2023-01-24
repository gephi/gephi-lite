import { dropRight, inRange } from "lodash";

import { atom } from "../utils/atoms";
import { Producer } from "../utils/reducers";
import { Filter, FiltersState } from "./types";
import { getEmptyFiltersState } from "./utils";

/**
 * Producers:
 * **********
 */
export const addFilter: Producer<FiltersState, [Filter]> = (filter) => {
  return (state) => ({
    ...state,
    past: state.past.concat(filter),
  });
};

export const resetFilters: Producer<FiltersState> = () => {
  return () => ({ past: [], future: [] });
};

export const openPastFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.past.length))
      throw new Error(`openPastFilter: Index ${index} is out of bounds of past filters.`);

    return {
      ...state,
      past: state.past.slice(0, index),
      future: state.past.slice(index).concat(state.future),
    };
  };
};

export const openFutureFilter: Producer<FiltersState, [number]> = (index) => {
  return (state) => {
    if (!inRange(index, 0, state.future.length))
      throw new Error(`openFutureFilter: Index ${index} is out of bounds of future filters.`);

    return {
      ...state,
      past: state.past.concat(state.future.slice(0, index)),
      future: state.future.slice(index),
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

export const filtersProducers = {
  addFilter,
  resetFilters,
  openPastFilter,
  openFutureFilter,
  deleteCurrentFilter,
} as const;

/**
 * Public API:
 * ***********
 */
export const filtersAtom = atom<FiltersState>(getEmptyFiltersState());
