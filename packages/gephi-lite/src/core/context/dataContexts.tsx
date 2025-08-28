import { Action, ReadableAtom, WritableAtom, useReadAtom } from "@ouestware/atoms";
import { reduce } from "lodash";
import { Context, FC, ReactNode, createContext, useContext } from "react";

import { appearanceActions, appearanceAtom } from "../appearance";
import { dataTableActions, dataTableAtom } from "../dataTable";
import { fileActions, fileAtom } from "../file";
import { filtersActions, filtersAtom } from "../filters";
import {
  dynamicItemDataAtom,
  filteredGraphAtom,
  graphDatasetActions,
  graphDatasetAtom,
  sigmaGraphAtom,
  topologicalFiltersAtom,
  visualGettersAtom,
} from "../graph";
import { layoutActions, layoutStateAtom } from "../layouts";
import { preferencesActions, preferencesAtom } from "../preferences";
import { searchActions, searchAtom } from "../search";
import { selectionActions, selectionAtom } from "../selection";
import { sessionActions, sessionAtom } from "../session";
import { sigmaActions, sigmaAtom, sigmaStateAtom } from "../sigma";
import { userActions, userAtom } from "../user";

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
  file: fileAtom,
  dataTable: dataTableAtom,
  appearance: appearanceAtom,
  sigmaState: sigmaStateAtom,
  sigmaGraph: sigmaGraphAtom,
  preferences: preferencesAtom,
  graphDataset: graphDatasetAtom,
  filteredGraph: filteredGraphAtom,
  visualGetters: visualGettersAtom,
  topologicalFilters: topologicalFiltersAtom,
  search: searchAtom,
  layoutState: layoutStateAtom,
  session: sessionAtom,
  user: userAtom,
  dynamicItemData: dynamicItemDataAtom,
};
type AtomName = keyof typeof ATOMS;

const CONTEXTS = {
  appearance: createContext(ATOMS.appearance),
  dataTable: createContext(ATOMS.dataTable),
  filters: createContext(ATOMS.filters),
  filteredGraph: createContext(ATOMS.filteredGraph),
  graphDataset: createContext(ATOMS.graphDataset),
  file: createContext(ATOMS.file),
  visualGetters: createContext(ATOMS.visualGetters),
  topologicalFilters: createContext(ATOMS.topologicalFilters),
  layoutState: createContext(ATOMS.layoutState),
  preferences: createContext(ATOMS.preferences),
  search: createContext(ATOMS.search),
  selection: createContext(ATOMS.selection),
  session: createContext(ATOMS.session),
  sigma: createContext(ATOMS.sigma),
  sigmaState: createContext(ATOMS.sigmaState),
  sigmaGraph: createContext(ATOMS.sigmaGraph),
  user: createContext(ATOMS.user),
  dynamicItemData: createContext(ATOMS.dynamicItemData),
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
  dataTableActions.reset();
  filtersActions.resetFilters();
  selectionActions.emptySelection();
  appearanceActions.resetState();
  sigmaActions.resetState();
  searchActions.reset();
  graphDatasetActions.resetGraph();
  fileActions.reset(full);
  layoutActions.stopLayout();

  if (full) {
    userActions.reset();
    sessionActions.reset();
  }
};

// Read data:
export const useFilters = makeUseAtom(CONTEXTS.filters);
export const useSigmaAtom = makeUseAtom(CONTEXTS.sigma);
export const useSelection = makeUseAtom(CONTEXTS.selection);
export const useFile = makeUseAtom(CONTEXTS.file);
export const useAppearance = makeUseAtom(CONTEXTS.appearance);
export const useSigmaState = makeUseAtom(CONTEXTS.sigmaState);
export const useSigmaGraph = makeUseAtom(CONTEXTS.sigmaGraph);
export const useDataTable = makeUseAtom(CONTEXTS.dataTable);
export const usePreferences = makeUseAtom(CONTEXTS.preferences);
export const useGraphDataset = makeUseAtom(CONTEXTS.graphDataset);
export const useFilteredGraph = makeUseAtom(CONTEXTS.filteredGraph);
export const useVisualGetters = makeUseAtom(CONTEXTS.visualGetters);
export const useTopologicalFilters = makeUseAtom(CONTEXTS.topologicalFilters);
export const useSearch = makeUseAtom(CONTEXTS.search);
export const useLayoutState = makeUseAtom(CONTEXTS.layoutState);
export const useUser = makeUseAtom(CONTEXTS.user);
export const useDynamicItemData = makeUseAtom(CONTEXTS.dynamicItemData);

export const useSigmaActions = makeUseActions(sigmaActions);
export const useFiltersActions = makeUseActions(filtersActions);
export const useSelectionActions = makeUseActions(selectionActions);
export const useDataTableActions = makeUseActions(dataTableActions);
export const useAppearanceActions = makeUseActions(appearanceActions);
export const useGraphDatasetActions = makeUseActions(graphDatasetActions);
export const usePreferencesActions = makeUseActions(preferencesActions);
export const useSearchActions = makeUseActions(searchActions);
export const useFileActions = makeUseActions(fileActions);
export const useLayoutActions = makeUseActions(layoutActions);
export const useUserActions = makeUseActions(userActions);

export const useResetStates = () => {
  return resetStates;
};
