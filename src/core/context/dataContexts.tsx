import { Context, createContext, FC, ReactNode, useContext } from "react";
import { reduce } from "lodash";

import { filtersActions, filtersAtom } from "../filters";
import { appearanceActions, appearanceAtom } from "../appearance";
import { filteredGraphAtom, graphDatasetActions, graphDatasetAtom, sigmaGraphAtom, visualGettersAtom } from "../graph";
import { ReadableAtom, useReadAtom, WritableAtom } from "../utils/atoms";
import { preferencesActions, preferencesAtom } from "../preferences";
import { selectionActions, selectionAtom } from "../selection";
import { sigmaActions, sigmaAtom, sigmaStateAtom } from "../sigma";
import { searchActions, searchAtom } from "../search";
import { Action } from "../utils/producers";
import { fileActions, fileStateAtom } from "../graph/files";

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
  sigma: sigmaAtom,
  filters: filtersAtom,
  selection: selectionAtom,
  fileState: fileStateAtom,
  appearance: appearanceAtom,
  sigmaState: sigmaStateAtom,
  sigmaGraph: sigmaGraphAtom,
  preferences: preferencesAtom,
  graphDataset: graphDatasetAtom,
  filteredGraph: filteredGraphAtom,
  visualGetters: visualGettersAtom,
  search: searchAtom,
};
type AtomName = keyof typeof ATOMS;

const CONTEXTS = {
  sigma: createContext(ATOMS.sigma),
  filters: createContext(ATOMS.filters),
  selection: createContext(ATOMS.selection),
  fileState: createContext(ATOMS.fileState),
  appearance: createContext(ATOMS.appearance),
  sigmaState: createContext(ATOMS.sigmaState),
  sigmaGraph: createContext(ATOMS.sigmaGraph),
  preferences: createContext(ATOMS.preferences),
  graphDataset: createContext(ATOMS.graphDataset),
  filteredGraph: createContext(ATOMS.filteredGraph),
  visualGetters: createContext(ATOMS.visualGetters),
  search: createContext(ATOMS.search),
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
export const resetStates: Action = () => {
  filtersActions.resetFilters();
  selectionActions.reset();
  appearanceActions.resetState();
  sigmaActions.resetState();
  searchActions.reset();
};

// Read data:
export const useFilters = makeUseAtom(CONTEXTS.filters);
export const useSigmaAtom = makeUseAtom(CONTEXTS.sigma);
export const useSelection = makeUseAtom(CONTEXTS.selection);
export const useFileState = makeUseAtom(CONTEXTS.fileState);
export const useAppearance = makeUseAtom(CONTEXTS.appearance);
export const useSigmaState = makeUseAtom(CONTEXTS.sigmaState);
export const useSigmaGraph = makeUseAtom(CONTEXTS.sigmaGraph);
export const usePreferences = makeUseAtom(CONTEXTS.preferences);
export const useGraphDataset = makeUseAtom(CONTEXTS.graphDataset);
export const useFilteredGraph = makeUseAtom(CONTEXTS.filteredGraph);
export const useVisualGetters = makeUseAtom(CONTEXTS.visualGetters);
export const useSearch = makeUseAtom(CONTEXTS.search);

export const useSigmaActions = makeUseActions(sigmaActions);
export const useFiltersActions = makeUseActions(filtersActions);
export const useSelectionActions = makeUseActions(selectionActions);
export const useAppearanceActions = makeUseActions(appearanceActions);
export const useGraphDatasetActions = makeUseActions(graphDatasetActions);
export const usePreferencesActions = makeUseActions(preferencesActions);
export const useSearchActions = makeUseActions(searchActions);
export const useFileActions = makeUseActions(fileActions);

export const useResetStates = () => {
  return resetStates;
};
