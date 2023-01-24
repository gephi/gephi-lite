import { Context, createContext, FC, ReactNode, useContext } from "react";
import { mapValues, reduce } from "lodash";

import { filtersAtom, filtersProducers } from "../filters";
import { appearanceAtom, appearanceProducers } from "../appearance";
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
function makeUseAction<T, Args extends unknown[] = []>(
  producer: Producer<T, Args>,
  atomContext: WritableAtomContext<T>,
) {
  return () => {
    const atom = useContext(atomContext);
    return (...args: Args) => {
      atom.set(producer(...args));
    };
  };
}

/**
 * Declare here all atoms used in the app:
 */
const ATOMS = {
  filters: filtersAtom,
  appearance: appearanceAtom,
  sigmaGraph: sigmaGraphAtom,
  graphDataset: graphDatasetAtom,
};
type AtomName = keyof typeof ATOMS;

const CONTEXTS = {
  filters: createContext(ATOMS.filters),
  appearance: createContext(ATOMS.appearance),
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
export const useAppearance = makeUseAtom(CONTEXTS.appearance);
export const useSigmaGraph = makeUseAtom(CONTEXTS.sigmaGraph);
export const useGraphDataset = makeUseAtom(CONTEXTS.graphDataset);

// Actions:
export const useAddFilter = makeUseAction(filtersProducers.addFilter, CONTEXTS.filters);
export const useResetFilters = makeUseAction(filtersProducers.resetFilters, CONTEXTS.filters);
export const useOpenPastFilter = makeUseAction(filtersProducers.openPastFilter, CONTEXTS.filters);
export const useOpenFutureFilter = makeUseAction(filtersProducers.openFutureFilter, CONTEXTS.filters);
export const useDeleteCurrentFilter = makeUseAction(filtersProducers.deleteCurrentFilter, CONTEXTS.filters);

export const useSetSizeAppearance = makeUseAction(appearanceProducers.setSizeAppearance, CONTEXTS.appearance);
export const useSetColorAppearance = makeUseAction(appearanceProducers.setColorAppearance, CONTEXTS.appearance);

export const useSetGraphMeta = makeUseAction(graphDatasetProducers.setGraphMeta, CONTEXTS.graphDataset);
export const useEditGraphMeta = makeUseAction(graphDatasetProducers.editGraphMeta, CONTEXTS.graphDataset);
export const useSetFieldModel = makeUseAction(graphDatasetProducers.setFieldModel, CONTEXTS.graphDataset);
