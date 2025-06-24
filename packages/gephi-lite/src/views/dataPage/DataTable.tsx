import { ItemData, ItemType } from "@gephi/gephi-lite-sdk";
import {
  Column,
  ColumnDef,
  Row,
  Table,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { VirtualItem, Virtualizer, useVirtualizer } from "@tanstack/react-virtual";
import cx from "classnames";
import { CSSProperties, FC, ReactNode, RefObject, useMemo, useRef } from "react";
import { PiArrowDown, PiArrowUp, PiArrowsDownUp, PiDotsThreeVertical } from "react-icons/pi";
import { ScrollSyncPane } from "react-scroll-sync";

import Dropdown from "../../components/Dropdown";
import { EdgeComponentById } from "../../components/Edge";
import { NodeComponentById } from "../../components/Node";
import {
  useDataTable,
  useDataTableActions,
  useGraphDataset,
  useSelection,
  useSelectionActions,
} from "../../core/context/dataContexts";

type ItemRow = { id: string; selected: boolean; data: ItemData };

const ARROWS: Record<string, ReactNode> = {
  asc: <PiArrowDown className="small ms-2" />,
  desc: <PiArrowUp className="small ms-2" />,
  both: <PiArrowsDownUp className="small ms-2" />,
};

const SPECIFIC_COLUMNS = {
  id: "id",
  selected: "selected",
  preview: "preview",
} as const;

const getCommonPinningStyles = (column: Column<ItemRow>, isInHead?: boolean): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left");

  return {
    borderRightWidth: isLastLeftPinnedColumn ? 2 : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? (isInHead ? 3 : 1) : undefined,
  };
};

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

const useDataTableColumns = (itemIDs: string[]) => {
  const { type } = useDataTable();
  const { toggle, select, unselect } = useSelectionActions();
  const { nodeFields, edgeFields } = useGraphDataset();

  const fields = useMemo(() => (type === "nodes" ? nodeFields : edgeFields), [edgeFields, nodeFields, type]);
  const columnHelper = useMemo(() => createColumnHelper<ItemRow>(), []);
  const columns = useMemo<ColumnDef<ItemRow>[]>(
    () => [
      // Agnostic columns;
      columnHelper.accessor((row) => row, {
        id: SPECIFIC_COLUMNS.selected,
        header: () => (
          <div
            className="text-center w-100"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <input
              className="form-check-input"
              type="checkbox"
              onChange={(e) =>
                e.target.checked
                  ? select({
                      type,
                      items: new Set(itemIDs),
                    })
                  : unselect({
                      type,
                      items: new Set(itemIDs),
                    })
              }
            />
          </div>
        ),
        size: 40,
        enableResizing: false,
        enablePinning: true,
        cell: (props) => (
          <div className="text-center w-100">
            <input
              className="form-check-input"
              type="checkbox"
              checked={props.getValue().selected}
              onChange={() =>
                toggle({
                  type,
                  item: props.getValue().id,
                })
              }
            />
          </div>
        ),
      }),
      columnHelper.display({
        id: SPECIFIC_COLUMNS.preview,
        header: "Preview",
        enablePinning: true,
        cell: (props) =>
          type === "nodes" ? (
            <NodeComponentById id={props.row.getValue("id")} />
          ) : (
            <EdgeComponentById id={props.row.getValue("id")} />
          ),
      }),
      {
        id: SPECIFIC_COLUMNS.id,
        accessorFn: ({ id }) => id,
        header: "ID",
        size: 60,
      },

      // Dataset-specific columns;
      ...fields.map(({ id: fieldId }) => ({
        id: `field::${fieldId}`,
        accessorFn: ({ data }: ItemRow) => data[fieldId],
        header: () => fieldId,
      })),
    ],
    [columnHelper, fields, itemIDs, select, toggle, type, unselect],
  );

  return {
    columns,
    columnPinningState: {
      columnPinning: {
        left: [SPECIFIC_COLUMNS.selected, SPECIFIC_COLUMNS.preview],
      },
    },
  };
};

export const DataTable: FC<{ type: ItemType; itemIDs: string[] }> = ({ type, itemIDs }) => {
  const { nodeData, edgeData } = useGraphDataset();
  const { type: selectionType, items } = useSelection();
  const data = useMemo(() => (type === "nodes" ? nodeData : edgeData), [edgeData, nodeData, type]);

  const { dataTableState } = useDataTable();
  const { updateColumnSizing, updateColumnSizingInfo, setSort } = useDataTableActions();
  const { columns, columnPinningState } = useDataTableColumns(itemIDs);

  const rows = useMemo<ItemRow[]>(
    () => itemIDs.map((id) => ({ id, selected: selectionType === "nodes" && items.has(id), data: data[id] })),
    [itemIDs, items, data, selectionType],
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
      maxSize: 400,
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
                    <th key={header.id} style={{ ...getCommonPinningStyles(header.column, true) }}>
                      <div
                        className={cx("content-wrapper", header.column.getCanSort() && "cursor-pointer select-none")}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="column-title">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {ARROWS[header.column.getIsSorted() as string] ?? null}
                        {header.id !== SPECIFIC_COLUMNS.selected && header.id !== SPECIFIC_COLUMNS.preview && (
                          <Dropdown
                            options={[
                              {
                                type: "option",
                                label: <>Sort ascendingly {ARROWS.asc}</>,
                                onClick: () => {
                                  console.log("HUHUHU", header.id);
                                  setSort([
                                    {
                                      id: header.id,
                                      desc: false,
                                    },
                                  ]);
                                },
                              },
                              {
                                type: "option",
                                label: <>Sort descendingly {ARROWS.desc}</>,
                                onClick: () => {
                                  console.log("HUHUHU", header.id);
                                  setSort([
                                    {
                                      id: header.id,
                                      desc: true,
                                    },
                                  ]);
                                },
                              },
                            ]}
                          >
                            <button className="btn p-0">
                              <PiDotsThreeVertical />
                            </button>
                          </Dropdown>
                        )}
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
