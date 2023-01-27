import { Context, createContext, FC, ReactNode, useContext } from "react";
import { reduce } from "lodash";

import { filtersActions, filtersAtom } from "../filters";
import { appearanceActions, appearanceAtom } from "../appearance";
import { graphDatasetActions, graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { ReadableAtom, useReadAtom, WritableAtom } from "../utils/atoms";
import { preferencesActions, preferencesAtom } from "../preferences";

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
function makeUseActions<T>(actionsCollection: T) {
  return () => {
    return actionsCollection;
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
  preferences: preferencesAtom,
};
type AtomName = keyof typeof ATOMS;

const CONTEXTS = {
  filters: createContext(ATOMS.filters),
  appearance: createContext(ATOMS.appearance),
  sigmaGraph: createContext(ATOMS.sigmaGraph),
  graphDataset: createContext(ATOMS.graphDataset),
  preferences: createContext(ATOMS.preferences),
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
export const usePreferences = makeUseAtom(CONTEXTS.preferences);

export const useFiltersActions = makeUseActions(filtersActions);
export const useAppearanceActions = makeUseActions(appearanceActions);
export const useGraphDatasetActions = makeUseActions(graphDatasetActions);
export const usePreferencesActions = makeUseActions(preferencesActions);
