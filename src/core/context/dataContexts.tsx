import { Context, createContext, FC, ReactNode, useContext } from "react";
import { mapValues, reduce } from "lodash";

import { filtersAtom, filtersProducers } from "../filters";
import { graphDatasetAtom, graphDatasetProducers, sigmaGraphAtom } from "../graph";
import { ReadableAtom, useReadAtom, WritableAtom } from "../utils/atoms";
import { Producer } from "../utils/reducers";

/**
 * Helpers:
 */
type WritableAtomContext<T> = Context<WritableAtom<T>>;
type ReadableAtomContext<T> = Context<ReadableAtom<T>>;

/**
 * Factories to get dedicated hooks:
 */
function makeUseAtom<T>(atomContext: ReadableAtomContext<T> | WritableAtomContext<T>) {
  return () => {
    const atom = useContext(atomContext as ReadableAtomContext<T>);
    return useReadAtom(atom);
  };
}
function makeUseActions<T>(producers: Record<string, Producer<T, any[]>>, atomContext: WritableAtomContext<T>) {
  return () => {
    const atom = useContext(atomContext);
    return mapValues(producers, <Args extends unknown[]>(producer: Producer<T, Args>) => {
      return (...args: Args) => {
        atom.set(producer(...args));
      };
    });
  };
}

/**
 * Declare here all atoms used in the app:
 */
const ATOMS = {
  filters: filtersAtom,
  sigmaGraph: sigmaGraphAtom,
  graphDataset: graphDatasetAtom,
};
type AtomName = keyof typeof ATOMS;

const CONTEXTS = {
  filters: createContext(ATOMS.filters),
  sigmaGraph: createContext(ATOMS.sigmaGraph),
  graphDataset: createContext(ATOMS.graphDataset),
};

/**
 * Public API:
 */
export const AtomsContextsRoot: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <>
      {reduce(
        CONTEXTS,
        (iter, context, key) => (
          <context.Provider value={ATOMS[key as AtomName] as any}>{iter || null}</context.Provider>
        ),
        children,
      )}
    </>
  );
};

// Read data:
export const useFilters = makeUseAtom(CONTEXTS.filters);
export const useSigmaGraph = makeUseAtom(CONTEXTS.sigmaGraph);
export const useGraphDataset = makeUseAtom(CONTEXTS.graphDataset);

// Actions:
export const useFiltersActions = makeUseActions(filtersProducers, CONTEXTS.filters);
export const useGraphDatasetActions = makeUseActions(graphDatasetProducers, CONTEXTS.graphDataset);
