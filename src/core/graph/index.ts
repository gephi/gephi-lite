import { atom } from '../utils/atoms';
import { Producer, producerToAction } from '../utils/reducers';
import { GraphDataset, SigmaGraph } from './types';
import { Filter, FiltersState } from '../filters/types';
import { datasetToSigmaGraph, getEmptyGraphDataset } from './utils';

/**
 * Producers:
 * **********
 */
const resetVisibleGraph: Producer<FiltersState, [Filter]> = (filter) => {
  return (state) => ({
    ...state,
    past: state.past.concat(filter),
  });
};

/**
 * Public API:
 * ***********
 */
export const graphDatasetAtom = atom<GraphDataset>(getEmptyGraphDataset());

export const sigmaGraphAtom = atom<SigmaGraph>(datasetToSigmaGraph(graphDatasetAtom.get()));
