import { Producer, atom, producerToAction } from "@ouestware/atoms";
import { ColumnSizingInfoState, SortingState, Updater } from "@tanstack/react-table";
import { ColumnSizingState } from "@tanstack/table-core";

import { DataTableState } from "./types";
import { getEmptyDataTableState } from "./utils";

/**
 * Producers:
 * **********
 */
export const updateQuery: Producer<DataTableState, [{ query?: string }]> = ({ query }) => {
  return (state) => ({
    ...state,
    search: query || "",
  });
};
export const updateColumnSizing: Producer<DataTableState, [Updater<ColumnSizingState>]> = (updater) => {
  return (state) => ({
    ...state,
    dataTableState: {
      ...state.dataTableState,
      columnSizing: typeof updater === "function" ? updater(state.dataTableState.columnSizing) : updater,
    },
  });
};
export const updateColumnSizingInfo: Producer<DataTableState, [Updater<ColumnSizingInfoState>]> = (updater) => {
  return (state) => ({
    ...state,
    dataTableState: {
      ...state.dataTableState,
      columnSizingInfo: typeof updater === "function" ? updater(state.dataTableState.columnSizingInfo) : updater,
    },
  });
};
export const setSort: Producer<DataTableState, [Updater<SortingState>]> = (updater) => {
  return (state) => ({
    ...state,
    dataTableState: {
      ...state.dataTableState,
      sorting: typeof updater === "function" ? updater(state.dataTableState.sorting) : updater,
    },
  });
};
export const toggleSort: Producer<DataTableState, [string]> = (column) => {
  return (state) => {
    const sorting = state.dataTableState.sorting;
    const newSorting: SortingState = [];

    const { id, desc } = sorting[0] || {};
    if (column !== id) newSorting.push({ id: column, desc: false });
    else if (!desc) newSorting.push({ id, desc: true });

    return {
      ...state,
      dataTableState: {
        ...state.dataTableState,
        sorting: newSorting,
      },
    };
  };
};

/**
 * Public API:
 * ***********
 */
export const dataTableAtom = atom<DataTableState>(getEmptyDataTableState());

export const dataTableActions = {
  updateQuery: producerToAction(updateQuery, dataTableAtom),
  updateColumnSizing: producerToAction(updateColumnSizing, dataTableAtom),
  updateColumnSizingInfo: producerToAction(updateColumnSizingInfo, dataTableAtom),
  setSort: producerToAction(setSort, dataTableAtom),
  toggleSort: producerToAction(toggleSort, dataTableAtom),
} as const;
