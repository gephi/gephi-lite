import { ItemData, ItemType } from "@gephi/gephi-lite-sdk";
import {
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
import { FC, RefObject, useMemo, useRef } from "react";

import { EdgeComponentById } from "../../components/Edge";
import { NodeComponentById } from "../../components/Node";
import { useGraphDataset, useSelection, useSelectionActions } from "../../core/context/dataContexts";

type ItemRow = { id: string; selected: boolean; data: ItemData };

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
        display: "flex",
        position: "absolute",
        transform: `translateY(${virtualRow.start}px)`,
        width: "100%",
      }}
    >
      {row.getVisibleCells().map((cell) => {
        return (
          <td
            key={cell.id}
            style={{
              display: "flex",
              width: cell.column.getSize(),
            }}
          >
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
    count: rows.length,
    overscan: 5,
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
        display: "grid",
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
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

export const DataTable: FC<{ type: ItemType; itemIDs: string[] }> = ({ type, itemIDs }) => {
  const { nodeData, edgeData, nodeFields, edgeFields } = useGraphDataset();
  const { type: selectionType, items } = useSelection();
  const data = useMemo(() => (type === "nodes" ? nodeData : edgeData), [edgeData, nodeData, type]);
  const fields = useMemo(() => (type === "nodes" ? nodeFields : edgeFields), [edgeFields, nodeFields, type]);

  const columnHelper = useMemo(() => createColumnHelper<ItemRow>(), []);
  const { toggle } = useSelectionActions();
  const rows = useMemo<ItemRow[]>(
    () => itemIDs.map((id) => ({ id, selected: selectionType === "nodes" && items.has(id), data: data[id] })),
    [itemIDs, items, data, selectionType],
  );

  const tableContainerRef = useRef<HTMLTableElement>(null);

  const columns = useMemo<ColumnDef<ItemRow>[]>(
    () => [
      // Agnostic columns;
      columnHelper.accessor((row) => row, {
        id: "selected",
        header: () => null,
        size: 30,
        cell: (props) => (
          <>
            <input
              type="checkbox"
              checked={props.getValue().selected}
              onChange={() =>
                toggle({
                  type,
                  item: props.getValue().id,
                })
              }
            />
          </>
        ),
      }),
      columnHelper.display({
        id: "preview",
        header: "Preview",
        cell: (props) =>
          type === "nodes" ? (
            <NodeComponentById id={props.row.getValue("id")} />
          ) : (
            <EdgeComponentById id={props.row.getValue("id")} />
          ),
      }),
      {
        id: "id",
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
    [columnHelper, fields, toggle, type],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="position-absolute inset-0">
      <table className="table d-grid w-100 h-100 overflow-auto" ref={tableContainerRef}>
        <thead
          style={{
            display: "grid",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ display: "flex", width: "100%" }}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    style={{
                      display: "flex",
                      width: header.getSize(),
                    }}
                  >
                    <div
                      {...{
                        className: header.column.getCanSort() ? "cursor-pointer select-none" : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <TableBody table={table} tableContainerRef={tableContainerRef} />
      </table>
    </div>
  );
};
