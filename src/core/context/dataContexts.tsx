import { Context, createContext, FC, ReactNode, useContext } from "react";
import { mapValues } from "lodash";

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
const filtersAtomContext = createContext(filtersAtom);
const sigmaGraphAtomContext = createContext(sigmaGraphAtom);
const graphDatasetAtomContext = createContext(graphDatasetAtom);

const REGISTRY = [
  { atom: filtersAtom, context: filtersAtomContext },
  { atom: sigmaGraphAtom, context: sigmaGraphAtomContext },
  { atom: graphDatasetAtom, context: graphDatasetAtomContext },
];

/**
 * Public API:
 */
export const AtomsContextsRoot: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <>
      {REGISTRY.reduce(
        (iter, { atom, context }) => (
          <context.Provider value={atom as any}>{iter || null}</context.Provider>
        ),
        children,
      )}
    </>
  );
};

// Read data:
export const useFilters = makeUseAtom(filtersAtomContext);
export const useSigmaGraph = makeUseAtom(sigmaGraphAtomContext);
export const useGraphDataset = makeUseAtom(graphDatasetAtomContext);

// Actions:
export const useFiltersActions = makeUseActions(filtersProducers, filtersAtomContext);
export const useGraphDatasetActions = makeUseActions(graphDatasetProducers, graphDatasetAtomContext);
