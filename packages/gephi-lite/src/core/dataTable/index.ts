import { Producer, atom, producerToAction } from "@ouestware/atoms";
import { ColumnSizingInfoState, Updater } from "@tanstack/react-table";
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
    columnsState: {
      ...state.columnsState,
      columnSizing:
        typeof updater === "function" ? updater(state.columnsState.columnSizing) : state.columnsState.columnSizing,
    },
  });
};
export const updateColumnSizingInfo: Producer<DataTableState, [Updater<ColumnSizingInfoState>]> = (updater) => {
  return (state) => ({
    ...state,
    columnsState: {
      ...state.columnsState,
      columnSizingInfo:
        typeof updater === "function"
          ? updater(state.columnsState.columnSizingInfo)
          : state.columnsState.columnSizingInfo,
    },
  });
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
} as const;
