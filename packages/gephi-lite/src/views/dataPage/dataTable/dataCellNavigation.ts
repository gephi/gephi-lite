import { createContext, useContext } from "react";

export type CellCoord = { rowId: string; columnId: string };
export type CellDirection = "up" | "down" | "left" | "right";

export type DataCellNavigationApi = {
  // The cell that should switch to edit mode, set by moveTo below. Read by DataCell to auto-enter
  // edit mode once the target row/column is (re)rendered, which also covers the case where the
  // target row was virtualized out and gets mounted only after the requested scroll completes.
  activeCell: CellCoord | null;
  // Moves from a cell being edited to its neighbor (up/down: same column, previous/next row;
  // left/right: same row, previous/next editable column) and requests edit mode there. A no-op at
  // the table's edges (first/last row or column) or when the origin cell can't be located anymore.
  moveTo: (from: CellCoord, direction: CellDirection) => void;
  // Must be called by the DataCell that consumes activeCell (ie. the one that just auto-entered edit
  // mode because of it), so the request doesn't linger: react-virtual recycles row DOM nodes while
  // scrolling, so without this, remounting that same row/column later would find the stale activeCell
  // still matching and pop it back into edit mode out of nowhere.
  clearActiveCell: () => void;
};

const noop: DataCellNavigationApi = { activeCell: null, moveTo: () => {}, clearActiveCell: () => {} };

export const DataCellNavigationContext = createContext<DataCellNavigationApi>(noop);

export const useDataCellNavigation = () => useContext(DataCellNavigationContext);
