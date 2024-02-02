import { reduce } from "lodash";
import { Context, FC, ReactNode, createContext, useContext } from "react";

import { appearanceActions, appearanceAtom } from "../appearance";
import { filtersActions, filtersAtom } from "../filters";
import { filteredGraphAtom, graphDatasetActions, graphDatasetAtom, sigmaGraphAtom, visualGettersAtom } from "../graph";
import { exportActions, exportStateAtom } from "../graph/export";
import { importActions, importStateAtom } from "../graph/import";
import { layoutActions, layoutStateAtom } from "../layouts";
import { preferencesActions, preferencesAtom } from "../preferences";
import { searchActions, searchAtom } from "../search";
import { selectionActions, selectionAtom } from "../selection";
import { sessionActions, sessionAtom } from "../session";
import { sigmaActions, sigmaAtom, sigmaStateAtom } from "../sigma";
import { userActions, userAtom } from "../user";
import { ReadableAtom, WritableAtom, useReadAtom } from "../utils/atoms";
import { Action } from "../utils/producers";

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
  importState: importStateAtom,
  exportState: exportStateAtom,
  appearance: appearanceAtom,
  sigmaState: sigmaStateAtom,
  sigmaGraph: sigmaGraphAtom,
  preferences: preferencesAtom,
  graphDataset: graphDatasetAtom,
  filteredGraph: filteredGraphAtom,
  visualGetters: visualGettersAtom,
  search: searchAtom,
  layoutState: layoutStateAtom,
  session: sessionAtom,
  user: userAtom,
};
type AtomName = keyof typeof ATOMS;

const CONTEXTS = {
  appearance: createContext(ATOMS.appearance),
  filters: createContext(ATOMS.filters),
  filteredGraph: createContext(ATOMS.filteredGraph),
  graphDataset: createContext(ATOMS.graphDataset),
  exportState: createContext(ATOMS.exportState),
  importState: createContext(ATOMS.importState),
  visualGetters: createContext(ATOMS.visualGetters),
  layoutState: createContext(ATOMS.layoutState),
  preferences: createContext(ATOMS.preferences),
  search: createContext(ATOMS.search),
  selection: createContext(ATOMS.selection),
  session: createContext(ATOMS.session),
  sigma: createContext(ATOMS.sigma),
  sigmaState: createContext(ATOMS.sigmaState),
  sigmaGraph: createContext(ATOMS.sigmaGraph),
  user: createContext(ATOMS.user),
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <context.Provider value={ATOMS[key as AtomName] as any}>{iter || null}</context.Provider>
        ),
        children,
      )}
    </>
  );
};

/**
 * Reset the application state (mainly for loading a new graph).
 * If full si specified, then we reset all data store in session.
 */
export const resetStates: Action<[boolean]> = (full = false) => {
  filtersActions.resetFilters();
  selectionActions.reset();
  appearanceActions.resetState();
  sigmaActions.resetState();
  searchActions.reset();
  graphDatasetActions.resetGraph();

  if (full) {
    userActions.reset();
    sessionActions.reset();
  }
};

// Read data:
export const useFilters = makeUseAtom(CONTEXTS.filters);
export const useSigmaAtom = makeUseAtom(CONTEXTS.sigma);
export const useSelection = makeUseAtom(CONTEXTS.selection);
export const useImportState = makeUseAtom(CONTEXTS.importState);
export const useExportState = makeUseAtom(CONTEXTS.exportState);
export const useAppearance = makeUseAtom(CONTEXTS.appearance);
export const useSigmaState = makeUseAtom(CONTEXTS.sigmaState);
export const useSigmaGraph = makeUseAtom(CONTEXTS.sigmaGraph);
export const usePreferences = makeUseAtom(CONTEXTS.preferences);
export const useGraphDataset = makeUseAtom(CONTEXTS.graphDataset);
export const useFilteredGraph = makeUseAtom(CONTEXTS.filteredGraph);
export const useVisualGetters = makeUseAtom(CONTEXTS.visualGetters);
export const useSearch = makeUseAtom(CONTEXTS.search);
export const useLayoutState = makeUseAtom(CONTEXTS.layoutState);
export const useUser = makeUseAtom(CONTEXTS.user);

export const useSigmaActions = makeUseActions(sigmaActions);
export const useFiltersActions = makeUseActions(filtersActions);
export const useSelectionActions = makeUseActions(selectionActions);
export const useAppearanceActions = makeUseActions(appearanceActions);
export const useGraphDatasetActions = makeUseActions(graphDatasetActions);
export const usePreferencesActions = makeUseActions(preferencesActions);
export const useSearchActions = makeUseActions(searchActions);
export const useImportActions = makeUseActions(importActions);
export const useExportActions = makeUseActions(exportActions);
export const useLayoutActions = makeUseActions(layoutActions);
export const useUserActions = makeUseActions(userActions);

export const useResetStates = () => {
  return resetStates;
};
