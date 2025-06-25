import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { PiDotsThreeVertical } from "react-icons/pi";
import ReactLinkify from "react-linkify";

import Dropdown from "../../../components/Dropdown";
import { EdgeComponentById } from "../../../components/Edge";
import { NodeComponentById } from "../../../components/Node";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import {
  useDataTable,
  useDataTableActions,
  useGraphDataset,
  useGraphDatasetActions,
  useSelectionActions,
} from "../../../core/context/dataContexts";
import { useModal } from "../../../core/modals";
import { DEFAULT_LINKIFY_PROPS } from "../../../utils/url";
import { Arrow, ItemRow, SPECIFIC_COLUMNS } from "./consts";

export const useDataTableColumns = (itemIDs: string[]) => {
  const { type } = useDataTable();
  const { openModal } = useModal();
  const { nodeFields, edgeFields } = useGraphDataset();

  const { setSort } = useDataTableActions();
  const { toggle, select, unselect } = useSelectionActions();
  const { moveFieldModel, deleteFieldModel, duplicateFieldModel } = useGraphDatasetActions();

  const fields = useMemo(() => (type === "nodes" ? nodeFields : edgeFields), [edgeFields, nodeFields, type]);
  const columnHelper = useMemo(() => createColumnHelper<ItemRow>(), []);
  const columns = useMemo<ColumnDef<ItemRow>[]>(
    () => [
      // Agnostic columns;
      columnHelper.accessor(({ selected }) => selected, {
        id: SPECIFIC_COLUMNS.selected,
        size: 60,
        enableResizing: false,
        enablePinning: true,
        header: ({ header }) => (
          <div
            className="text-center w-100 d-flex flex-row align-items-center justify-content-between"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <input
              className="form-check-input m-0 p-0"
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
            <div>
              <button className="btn small p-0" onClick={header.column.getToggleSortingHandler()}>
                <Arrow arrow={header.column.getIsSorted() || "both"} />
              </button>
            </div>
          </div>
        ),
        cell: (props) => (
          <div className="w-100">
            <input
              className="form-check-input"
              type="checkbox"
              checked={props.getValue()}
              onChange={() =>
                toggle({
                  type,
                  item: props.row.getValue("id"),
                })
              }
            />
          </div>
        ),
      }),
      columnHelper.display({
        id: SPECIFIC_COLUMNS.preview,
        header: () => <span className="column-title">Preview</span>,
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
        header: ({ header }) => (
          <>
            <span className="column-title">ID</span>
            <Arrow
              arrow={header.column.getIsSorted() || null}
              wrapper={({ children }) => (
                <div>
                  <button className="btn small p-0">{children}</button>
                </div>
              )}
            />
          </>
        ),
        size: 60,
        cell: (props) => <span className="text-ellipsis">{props.row.getValue("id")}</span>,
      },

      // Dataset-specific columns;
      ...fields.map<ColumnDef<ItemRow>>((field, i, a) => ({
        id: `field::${field.id}`,
        accessorFn: ({ data }: ItemRow) => data[field.id],
        header: ({ header }) => (
          <>
            <span className="column-title" onClick={header.column.getToggleSortingHandler()}>
              {field.id}
            </span>

            <Arrow
              arrow={header.column.getIsSorted() || null}
              wrapper={({ children }) => (
                <div>
                  <button className="btn small p-0" onClick={header.column.getToggleSortingHandler()}>
                    {children}
                  </button>
                </div>
              )}
            />

            <Dropdown
              options={[
                {
                  type: "text",
                  label: <strong>{field.id}</strong>,
                },
                {
                  type: "text",
                  label: "TODO: insert data type",
                },
                {
                  type: "divider",
                },
                {
                  label: <>Modify column</>,
                  onClick: () => console.log("TODO"),
                },
                {
                  type: "divider",
                },
                {
                  label: <>Duplicate column</>,
                  onClick: () => duplicateFieldModel(field),
                },
                {
                  label: <>Move to the left</>,
                  disabled: !i,
                  onClick: () => moveFieldModel(type, field.id, -1),
                },
                {
                  label: <>Move to the right</>,
                  disabled: i === a.length - 1,
                  onClick: () => moveFieldModel(type, field.id, +1),
                },
                {
                  label: <>Insert new column to the left</>,
                  onClick: () => console.log("TODO"),
                },
                {
                  label: <>Insert new column to the right</>,
                  onClick: () => console.log("TODO"),
                },
                {
                  type: "divider",
                },
                {
                  label: <>Sort A→Z (0→9)</>,
                  onClick: () => {
                    setSort([
                      {
                        id: header.id,
                        desc: false,
                      },
                    ]);
                  },
                },
                {
                  label: <>Sort Z→A (9→0)</>,
                  onClick: () => {
                    setSort([
                      {
                        id: header.id,
                        desc: true,
                      },
                    ]);
                  },
                },
                {
                  type: "divider",
                },
                {
                  label: <>Delete attribute</>,
                  onClick: () =>
                    openModal({
                      component: ConfirmModal,
                      arguments: {
                        title: `Delete ${type} attribute "${field.id}"`,
                        message: `Are you sure you want to delete the ${type} attribute "${field.id}"?`,
                      },
                      afterSubmit: () => {
                        deleteFieldModel(field);
                      },
                    }),
                },
              ]}
            >
              <button className="btn p-0">
                <PiDotsThreeVertical />
              </button>
            </Dropdown>
          </>
        ),
        cell: (props) => (
          <span className="text-ellipsis">
            <ReactLinkify {...DEFAULT_LINKIFY_PROPS}>{props.row.getValue(`field::${field.id}`)}</ReactLinkify>
          </span>
        ),
      })),
    ],
    [
      columnHelper,
      deleteFieldModel,
      duplicateFieldModel,
      fields,
      itemIDs,
      moveFieldModel,
      openModal,
      select,
      setSort,
      toggle,
      type,
      unselect,
    ],
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
