import { ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import { Row, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { VirtualItem, Virtualizer, useVirtualizer } from "@tanstack/react-virtual";
import cx from "classnames";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollSyncPane } from "react-scroll-sync";

import {
  useDataTable,
  useDataTableActions,
  useDynamicItemData,
  useGraphDataset,
  useSelection,
} from "../../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../../core/context/eventsContext";
import { DynamicEdgeAttributeId, DynamicNodeAttributeId } from "../../../core/graph/dynamicAttributes";
import { ItemRow, SPECIFIC_COLUMNS, getCommonPinningStyles } from "./consts";
import { CellCoord, DataCellNavigationContext } from "./dataCellNavigation";
import { useDataTableColumns } from "./useDataTableColumns";

const TableBodyRow: FC<{
  row: Row<ItemRow>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
}> = ({ row, virtualRow, rowVirtualizer }) => {
  return (
    <tr
      data-index={virtualRow.index}
      ref={(node) => rowVirtualizer.measureElement(node)}
      key={row.id}
      style={{
        top: `${virtualRow.start}px`,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} data-field={cell.column.id} style={{ ...getCommonPinningStyles(cell.column) }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};

export const DataTable: FC<{ itemIDs: string[] }> = ({ itemIDs }) => {
  const { emitter } = useEventsContext();
  const { nodeData, edgeData, fullGraph } = useGraphDataset();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const { type: selectionType, items } = useSelection();

  const { type, dataTableState } = useDataTable();
  const { updateColumnSizing, updateColumnSizingInfo, setSort } = useDataTableActions();
  const { columns, columnPinningState, editableColumnIds } = useDataTableColumns(itemIDs);

  const data = useMemo(() => (type === "nodes" ? nodeData : edgeData), [edgeData, nodeData, type]);
  const dynamicData = useMemo(
    () => (type === "nodes" ? dynamicNodeData : dynamicEdgeData),
    [dynamicNodeData, dynamicEdgeData, type],
  );
  const dataRows = useMemo<ItemRow[]>(
    () =>
      itemIDs.map((id) =>
        type === "nodes"
          ? {
              id,
              selected: selectionType === type && items.has(id),
              data: data[id],
              ...(dynamicData[id] as Record<DynamicNodeAttributeId, Scalar>),
            }
          : {
              id,
              selected: selectionType === type && items.has(id),
              sourceId: fullGraph.source(id),
              targetId: fullGraph.target(id),
              data: data[id],
              ...(dynamicData[id] as Record<DynamicEdgeAttributeId, Scalar>),
            },
      ),
    [itemIDs, type, selectionType, items, dynamicData, data, fullGraph],
  );

  const tableContainerRef = useRef<HTMLTableElement>(null);
  const table = useReactTable({
    data: dataRows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    onSortingChange: setSort,
    defaultColumn: {
      minSize: 30,
      enableResizing: true,
    },
    state: {
      ...dataTableState,
      ...columnPinningState,
    },
    onColumnSizingChange: updateColumnSizing,
    onColumnSizingInfoChange: updateColumnSizingInfo,
  });
  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    overscan: 5,
    count: dataRows.length,
    estimateSize: () => 41,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  // Arrow-key navigation while editing a cell (see DataCell/EditDataCell): up/down keep the same
  // column and move to the previous/next row (using the current sorted row order, so it works
  // whichever row is currently virtualized in or out), left/right keep the same row and move to the
  // previous/next editable column. Setting activeCell is enough even when the target row isn't
  // currently mounted: the scroll below makes react-virtual mount it, and DataCell picks up the
  // matching activeCell as soon as it renders.
  const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
  const moveTo = useCallback(
    (from: CellCoord, direction: "up" | "down" | "left" | "right") => {
      if (direction === "up" || direction === "down") {
        const rowIds = table.getRowModel().rows.map((r) => r.id);
        const index = rowIds.indexOf(from.rowId);
        const nextIndex = direction === "up" ? index - 1 : index + 1;
        if (index === -1 || nextIndex < 0 || nextIndex >= rowIds.length) return;
        rowVirtualizer.scrollToIndex(nextIndex, { align: "auto" });
        setActiveCell({ rowId: rowIds[nextIndex], columnId: from.columnId });
      } else {
        const index = editableColumnIds.indexOf(from.columnId);
        const nextIndex = direction === "left" ? index - 1 : index + 1;
        if (index === -1 || nextIndex < 0 || nextIndex >= editableColumnIds.length) return;
        setActiveCell({ rowId: from.rowId, columnId: editableColumnIds[nextIndex] });
      }
    },
    [table, rowVirtualizer, editableColumnIds],
  );
  const clearActiveCell = useCallback(() => setActiveCell(null), []);

  useEffect(() => {
    const scrollToID = (id: string) => {
      const sortedRows = table.getRowModel().rows;
      const sortedIndex = sortedRows.findIndex((r) => r.id === id);
      rowVirtualizer.scrollToIndex(sortedIndex, { align: "center" });
    };

    // Handle scrolling to newly created nodes and edges:
    const newItemEvent = type === "nodes" ? EVENTS.nodeCreated : EVENTS.edgeCreated;
    const newItemHandler = ({ id }: { id: string }) => {
      scrollToID(id);
    };

    // Handle scrolling to searched items:
    const searchedItemsHandler = ({ type: eventItemType, ids }: { type: ItemType; ids: string[] }) => {
      if (type !== eventItemType) return;

      if (ids.length === 1) {
        scrollToID(ids[0]);
      } else {
        setSort([{ id: SPECIFIC_COLUMNS.selected, desc: true }]);
        rowVirtualizer.scrollToIndex(0);
      }
    };

    emitter.on(newItemEvent, newItemHandler);
    emitter.on(EVENTS.searchResultsSelected, searchedItemsHandler);
    return () => {
      emitter.off(newItemEvent, newItemHandler);
      emitter.off(EVENTS.searchResultsSelected, searchedItemsHandler);
    };
  }, [emitter, rowVirtualizer, setSort, table, type]);

  return (
    <DataCellNavigationContext.Provider value={{ activeCell, moveTo, clearActiveCell }}>
      <div className="position-absolute inset-0">
        <ScrollSyncPane innerRef={tableContainerRef}>
          <table
            ref={tableContainerRef}
            className={cx(
              "data-table table table-bordered",
              table.getState().columnSizingInfo.isResizingColumn && "is-resizing",
            )}
          >
            <thead className="table-light">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        style={{ ...getCommonPinningStyles(header.column, true) }}
                        className={cx(header.id in SPECIFIC_COLUMNS && "protected")}
                      >
                        <div
                          className={cx("content-wrapper", header.column.getCanSort() && "cursor-pointer select-none")}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}

                          {header.column.getCanResize() && (
                            <div
                              className={cx("resizer", header.column.getIsResizing() && "is-resizing")}
                              onTouchStart={header.getResizeHandler()}
                              onDoubleClick={() => header.column.resetSize()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                header.getResizeHandler()(e);
                              }}
                            />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <TableBodyRow
                  key={tableRows[virtualRow.index].id}
                  row={tableRows[virtualRow.index]}
                  virtualRow={virtualRow}
                  rowVirtualizer={rowVirtualizer}
                />
              ))}
            </tbody>
          </table>
        </ScrollSyncPane>
      </div>
    </DataCellNavigationContext.Provider>
  );
};
