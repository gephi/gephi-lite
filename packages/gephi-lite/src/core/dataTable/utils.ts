import { DataTableState } from "./types";

/**
 * Returns an empty selection state:
 */
export function getEmptyDataTableState(): DataTableState {
  return {
    type: "nodes",
    search: "",
    dataTableState: {
      // Columns sizing:
      columnSizing: {},
      columnSizingInfo: {
        columnSizingStart: [],
        deltaOffset: null,
        deltaPercentage: null,
        isResizingColumn: false,
        startOffset: null,
        startSize: null,
      },
      // Sorting:
      sorting: [],
    },
  };
}
