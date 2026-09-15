import { ItemType } from "@gephi/gephi-lite-sdk";
import { Producer, producerToAction } from "@ouestware/atoms";
import { ColumnSizingInfoState, ColumnSizingState, SortingState, Updater } from "@tanstack/react-table";

import { SPECIFIC_COLUMNS } from "../../views/dataPage/dataTable/consts";
import { dataTableAtom } from "./atom";
import { DataTableState } from "./types";
import { getEmptyDataTableState } from "./utils";

const reset: Producer<DataTableState, []> = () => {
  return (state) => ({ ...getEmptyDataTableState(), type: state.type });
};
const setType: Producer<DataTableState, [ItemType]> = (type) => {
  return (state) => ({
    ...state,
    type,
  });
};
const updateQuery: Producer<DataTableState, [{ query?: string }]> = ({ query }) => {
  return (state) => ({
    ...state,
    search: query || "",
  });
};
const updateColumnSizing: Producer<DataTableState, [Updater<ColumnSizingState>]> = (updater) => {
  return (state) => ({
    ...state,
    dataTableState: {
      ...state.dataTableState,
      columnSizing: typeof updater === "function" ? updater(state.dataTableState.columnSizing) : updater,
    },
  });
};
const updateColumnSizingInfo: Producer<DataTableState, [Updater<ColumnSizingInfoState>]> = (updater) => {
  return (state) => ({
    ...state,
    dataTableState: {
      ...state.dataTableState,
      columnSizingInfo: typeof updater === "function" ? updater(state.dataTableState.columnSizingInfo) : updater,
    },
  });
};
const setSort: Producer<DataTableState, [Updater<SortingState>]> = (updater) => {
  return (state) => ({
    ...state,
    dataTableState: {
      ...state.dataTableState,
      sorting: typeof updater === "function" ? updater(state.dataTableState.sorting) : updater,
    },
  });
};
const toggleSort: Producer<DataTableState, [string]> = (column) => {
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
const showSelection: Producer<DataTableState, [ItemType]> = (type) => {
  return (state) => ({
    ...state,
    type,
    search: "",
    dataTableState: {
      ...state.dataTableState,
      sorting: [
        {
          id: SPECIFIC_COLUMNS.selected,
          desc: true,
        },
      ],
    },
  });
};

export const dataTableActions = {
  reset: producerToAction(reset, dataTableAtom),
  setType: producerToAction(setType, dataTableAtom),
  updateQuery: producerToAction(updateQuery, dataTableAtom),
  updateColumnSizing: producerToAction(updateColumnSizing, dataTableAtom),
  updateColumnSizingInfo: producerToAction(updateColumnSizingInfo, dataTableAtom),
  setSort: producerToAction(setSort, dataTableAtom),
  toggleSort: producerToAction(toggleSort, dataTableAtom),
  showSelection: producerToAction(showSelection, dataTableAtom),
} as const;
