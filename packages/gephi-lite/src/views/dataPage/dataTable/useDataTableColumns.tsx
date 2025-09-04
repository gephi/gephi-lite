import { DynamicItemDataSpec, ItemType } from "@gephi/gephi-lite-sdk";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { isBoolean, size, values } from "lodash";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import Dropdown from "../../../components/Dropdown";
import { ThreeDotsVerticalIcon } from "../../../components/common-icons";
import { AttributeLabel } from "../../../components/data/Attribute";
import { EdgeComponentById } from "../../../components/data/Edge";
import { EditFieldModelModal } from "../../../components/data/EditFieldModel";
import { NodeComponentById } from "../../../components/data/Node";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import {
  useDataTable,
  useDataTableActions,
  useGraphDataset,
  useGraphDatasetActions,
  useSelectionActions,
} from "../../../core/context/dataContexts";
import { DYNAMIC_ATTRIBUTES } from "../../../core/graph/dynamicAttributes";
import { useModal } from "../../../core/modals";
import { useMobile } from "../../../hooks/useMobile";
import { DataCell } from "./DataCell";
import { Arrow, ItemRow, SPECIFIC_COLUMNS } from "./consts";

export const useDataTableColumns = (itemIDs: string[]) => {
  const { t } = useTranslation();
  const { type } = useDataTable();
  const { openModal } = useModal();
  const { nodeFields, edgeFields, nodeData, edgeData, fullGraph } = useGraphDataset();
  const isMobile = useMobile();

  const { setSort } = useDataTableActions();
  const { toggle, select, unselect } = useSelectionActions();
  const { moveFieldModel, deleteFieldModel, duplicateFieldModel } = useGraphDatasetActions();

  const fields = useMemo(() => (type === "nodes" ? nodeFields : edgeFields), [edgeFields, nodeFields, type]);
  const columnHelper = useMemo(() => createColumnHelper<ItemRow>(), []);
  const getSpecificRow = useCallback(
    (field: keyof ItemRow, options?: { size?: number; label?: string }): ColumnDef<ItemRow> => {
      return {
        id: field,
        accessorFn: (row) => row[field],
        cell: (props) => <span className="text-ellipsis">{props.row.getValue(field)}</span>,
        meta: {
          protected: true,
        },
        header: ({ header }) => (
          <>
            <span className="column-title" onClick={header.column.getToggleSortingHandler()}>
              {options?.label ? options.label : t(`datatable.protected_columns.${field}`)}
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
          </>
        ),
        size: options?.size || 180,
      };
    },
    [t],
  );
  const getDynamicColumn = useCallback(
    (dynamicField: DynamicItemDataSpec<ItemType>): ColumnDef<ItemRow> => {
      return {
        id: `dynamic::${dynamicField.field.id}`,
        accessorFn: (row) => row[dynamicField.field.id as keyof ItemRow],
        cell: (props) => (
          <DataCell
            type={type}
            id={props.row.getValue("id")}
            field={dynamicField.field}
            value={props.row.getValue(`dynamic::${dynamicField.field.id}`)}
            readOnly={!dynamicField.editable}
          />
        ),
        meta: {
          protected: true,
        },
        header: ({ header }) => (
          <>
            <span className="column-title" onClick={header.column.getToggleSortingHandler()}>
              {t(dynamicField.i18nKey)}
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
          </>
        ),
        size: 180,
      };
    },
    [t, type],
  );
  const columns = useMemo<ColumnDef<ItemRow>[]>(
    () => [
      // Agnostic columns;
      columnHelper.accessor(({ selected }) => selected, {
        id: SPECIFIC_COLUMNS.selected,
        size: 60,
        enableResizing: false,
        enablePinning: !isMobile,
        meta: {
          protected: true,
        },
        header: ({ header }) => (
          <div
            className="text-center w-100 d-flex flex-row align-items-center justify-content-between"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="form-check">
              <input
                className="form-check-input "
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
            <div>
              <button className="btn small p-0" onClick={header.column.getToggleSortingHandler()}>
                <Arrow arrow={header.column.getIsSorted() || "both"} />
              </button>
            </div>
          </div>
        ),
        cell: (props) => (
          <div className="w-100 form-check">
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
        header: () => <span className="column-title">{t("datatable.protected_columns.preview")}</span>,
        enablePinning: !isMobile,
        meta: {
          protected: true,
        },
        cell: (props) =>
          type === "nodes" ? (
            <NodeComponentById id={props.row.getValue("id")} />
          ) : (
            <EdgeComponentById id={props.row.getValue("id")} />
          ),
      }),

      // Type specific dynamic / read-only columns:
      getSpecificRow("id"),
      ...(type === "nodes"
        ? values(DYNAMIC_ATTRIBUTES.nodes).map((f) => getDynamicColumn(f))
        : [
            getSpecificRow(SPECIFIC_COLUMNS.sourceId as keyof ItemRow),
            getSpecificRow(SPECIFIC_COLUMNS.targetId as keyof ItemRow),
            ...values(DYNAMIC_ATTRIBUTES.edges)
              .filter((f) => (isBoolean(f.showInDataTable) ? f.showInDataTable : f.showInDataTable(fullGraph)))
              .map((f) => getDynamicColumn(f)),
          ]),

      // Dataset-specific columns;
      ...fields.map<ColumnDef<ItemRow>>((field, i, a) => ({
        id: `field::${field.id}`,
        accessorFn: ({ data }: ItemRow) => data[field.id],
        header: ({ header }) => (
          <>
            <AttributeLabel field={field} className="column-title" onClick={header.column.getToggleSortingHandler()} />

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
                  label: t("datatable.modify_column"),
                  onClick: () => {
                    openModal({ component: EditFieldModelModal, arguments: { fieldModelId: field.id, type } });
                  },
                },
                {
                  type: "divider",
                },
                {
                  label: t("datatable.duplicate_column"),
                  onClick: () => duplicateFieldModel(field),
                },
                {
                  label: t("datatable.move_left"),
                  disabled: !i,
                  onClick: () => moveFieldModel(type, field.id, -1),
                },
                {
                  label: t("datatable.move_right"),
                  disabled: i === a.length - 1,
                  onClick: () => moveFieldModel(type, field.id, +1),
                },
                {
                  label: t("datatable.insert_left"),
                  onClick: () =>
                    openModal({
                      component: EditFieldModelModal,
                      arguments: { insertAt: { pos: "before", id: field.id }, type },
                    }),
                },
                {
                  label: t("datatable.insert_right"),
                  onClick: () =>
                    openModal({
                      component: EditFieldModelModal,
                      arguments: { insertAt: { pos: "after", id: field.id }, type },
                    }),
                },
                {
                  type: "divider",
                },
                {
                  label: t("datatable.sort_asc"),
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
                  label: t("datatable.sort_desc"),
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
                  label: t("edition.delete_attribute"),
                  onClick: () =>
                    openModal({
                      component: ConfirmModal,
                      arguments: {
                        title: t(`edition.delete_${type}_attributes`, { name: field.id }),
                        message: t("edition.confirm_delete_attributes", {
                          nbValues: size(type === "nodes" ? nodeData : edgeData),
                          name: field.id,
                        }),
                        successMsg: t(`edition.delete_attributes_success`, { name: field.id }),
                      },
                      afterSubmit: () => {
                        deleteFieldModel(field);
                      },
                    }),
                },
              ]}
            >
              <button className="btn p-0">
                <ThreeDotsVerticalIcon />
              </button>
            </Dropdown>
          </>
        ),
        cell: (props) => (
          <DataCell
            type={type}
            id={props.row.getValue("id")}
            field={field}
            value={props.row.getValue(`field::${field.id}`)}
          />
        ),
      })),
    ],
    [
      columnHelper,
      isMobile,
      getSpecificRow,
      type,
      fields,
      select,
      itemIDs,
      unselect,
      toggle,
      t,
      getDynamicColumn,
      fullGraph,
      openModal,
      duplicateFieldModel,
      moveFieldModel,
      setSort,
      nodeData,
      edgeData,
      deleteFieldModel,
    ],
  );

  return {
    columns,
    columnPinningState: {
      columnPinning: {
        left: isMobile ? [] : [SPECIFIC_COLUMNS.selected, SPECIFIC_COLUMNS.preview],
      },
    },
  };
};
