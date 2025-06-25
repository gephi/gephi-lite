import { Row, Table, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { VirtualItem, Virtualizer, useVirtualizer } from "@tanstack/react-virtual";
import cx from "classnames";
import { FC, RefObject, useMemo, useRef } from "react";
import { ScrollSyncPane } from "react-scroll-sync";

import {
  useDataTable,
  useDataTableActions,
  useDynamicItemData,
  useGraphDataset,
  useSelection,
} from "../../../core/context/dataContexts";
import { ItemRow, SPECIFIC_COLUMNS, getCommonPinningStyles } from "./consts";
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
      {row.getVisibleCells().map((cell) => {
        return (
          <td key={cell.id} style={{ ...getCommonPinningStyles(cell.column) }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
};

const TableBody: FC<{
  table: Table<ItemRow>;
  tableContainerRef: RefObject<HTMLDivElement>;
}> = ({ table, tableContainerRef }) => {
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    overscan: 5,
    count: rows.length,
    estimateSize: () => 41,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  return (
    <tbody
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<ItemRow>;
        return (
          <TableBodyRow
            key={rows[virtualRow.index].id}
            row={row}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
          />
        );
      })}
    </tbody>
  );
};

export const DataTable: FC<{ itemIDs: string[] }> = ({ itemIDs }) => {
  const { nodeData, edgeData, fullGraph } = useGraphDataset();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const { type: selectionType, items } = useSelection();

  const { type, dataTableState } = useDataTable();
  const { updateColumnSizing, updateColumnSizingInfo, setSort } = useDataTableActions();
  const { columns, columnPinningState } = useDataTableColumns(itemIDs);

  const data = useMemo(() => (type === "nodes" ? nodeData : edgeData), [edgeData, nodeData, type]);
  const dynamicData = useMemo(
    () => (type === "nodes" ? dynamicNodeData : dynamicEdgeData),
    [dynamicNodeData, dynamicEdgeData, type],
  );
  const rows = useMemo<ItemRow[]>(
    () =>
      itemIDs.map((id) =>
        type === "nodes"
          ? {
              id,
              selected: selectionType === type && items.has(id),
              degree: dynamicData[id].degree as number,
              data: data[id],
            }
          : {
              id,
              selected: selectionType === type && items.has(id),
              sourceId: fullGraph.source(id),
              targetId: fullGraph.target(id),
              data: data[id],
            },
      ),
    [itemIDs, type, selectionType, items, dynamicData, data, fullGraph],
  );

  const tableContainerRef = useRef<HTMLTableElement>(null);
  const table = useReactTable({
    data: rows,
    columns,
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

  return (
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
          <TableBody table={table} tableContainerRef={tableContainerRef} />
        </table>
      </ScrollSyncPane>
    </div>
  );
};
