import { dropRight, inRange } from "lodash";

import { atom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/reducers";
import { Filter, FiltersState } from "./types";
import { getEmptyFiltersState } from "./utils";

/**
 * Producers:
 * **********
 */
const addFilterProducer: Producer<FiltersState, [Filter]> = (filter) => {
  return (state) => ({
    ...state,
    past: state.past.concat(filter),
  });
};

const resetFiltersProducer: Producer<FiltersState> = () => {
  return () => ({ past: [], future: [] });
};

const openPastFilterProducer: Producer<FiltersState, [number]> = (index) => {
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

const openFutureFilterProducer: Producer<FiltersState, [number]> = (index) => {
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

const deleteCurrentFilterProducer: Producer<FiltersState> = () => {
  return (state) => {
    if (!state.past.length) throw new Error(`deleteCurrentFilter: There is not filter to delete.`);

    return {
      ...state,
      past: dropRight(state.past, 1),
    };
  };
};

export const filtersProducers = {
  addFilterProducer,
  resetFiltersProducer,
  openPastFilterProducer,
  openFutureFilterProducer,
  deleteCurrentFilterProducer,
};

/**
 * Public API:
 * ***********
 */
export const filtersAtom = atom<FiltersState>(getEmptyFiltersState());

export const addFilter = producerToAction(addFilterProducer, filtersAtom);
export const resetFilters = producerToAction(resetFiltersProducer, filtersAtom);
export const openPastFilter = producerToAction(openPastFilterProducer, filtersAtom);
export const openFutureFilter = producerToAction(openFutureFilterProducer, filtersAtom);
export const deleteCurrentFilter = producerToAction(deleteCurrentFilterProducer, filtersAtom);
