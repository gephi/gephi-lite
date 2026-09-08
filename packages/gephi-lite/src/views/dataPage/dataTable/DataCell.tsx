import { FieldModel, ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { isNil } from "lodash";
import { FC, MouseEventHandler, forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiCheck } from "react-icons/pi";
import TetherComponent from "react-tether";

import { CancelIcon } from "../../../components/common-icons";
import { EditItemAttribute, RenderItemAttribute } from "../../../components/data/Attribute";
import { useGraphDatasetActions } from "../../../core/context/dataContexts";
import { CellDirection, useDataCellNavigation } from "./dataCellNavigation";

// Arrow-key navigation is only taken over for field types where arrow keys have no built-in meaning
// of their own: overriding them for "category"/"keywords" would break react-select's own option
// navigation, and for "color" the color picker's own key handling.
const ARROW_NAV_FIELD_TYPES: FieldModel<ItemType, boolean>["type"][] = ["text", "url", "number", "date"];

const ARROW_KEY_DIRECTIONS: Record<string, CellDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export const ReadDataCell = forwardRef<
  HTMLSpanElement,
  { value: Scalar; field: FieldModel<ItemType, boolean>; onClick?: MouseEventHandler; readOnly?: boolean }
>(({ value, field, onClick, readOnly }, ref) => {
  return (
    <span
      ref={ref}
      className={cx("data-cell", !readOnly && "editable")}
      title={!isNil(value) ? value + "" : undefined}
      onClick={onClick}
    >
      <RenderItemAttribute value={value} field={field} />
    </span>
  );
});

export const InlineEditDataCell: FC<{
  type: ItemType;
  id: string;
  field: FieldModel<ItemType, boolean>;
  value: Scalar;
}> = ({ type, id, field, value }) => {
  const { updateNode, updateEdge } = useGraphDatasetActions();

  return (
    <span className="data-cell editable" title={!isNil(value) ? value + "" : undefined}>
      <EditItemAttribute
        field={field}
        scalar={value}
        onChange={(value) => {
          const update = type === "nodes" ? updateNode : updateEdge;
          if (field.dynamic) {
            update(id, {}, { merge: true, [field.id]: value });
          } else {
            update(id, { [field.id]: value }, { merge: true });
          }
        }}
      />
    </span>
  );
};

export const EditDataCell: FC<{
  type: ItemType;
  id: string;
  field: FieldModel<ItemType, boolean>;
  value: Scalar;
  columnId: string;
  close: () => void;
}> = ({ type, id, field, columnId, close, value: initialValue }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<Scalar>(initialValue);
  const { updateNode, updateEdge } = useGraphDatasetActions();
  const update = type === "nodes" ? updateNode : updateEdge;
  const { moveTo } = useDataCellNavigation();

  const targetWrapper = useRef<HTMLDivElement>(null);
  const elementWrapper = useRef<HTMLFormElement>(null);

  const commit = useCallback(
    (committedValue: Scalar) => {
      if (field.dynamic) {
        update(id, {}, { merge: true, [field.id]: committedValue });
      } else {
        update(id, { [field.id]: committedValue }, { merge: true });
      }
    },
    [field, id, update],
  );

  // Handle interactions:
  useEffect(() => {
    const handleClickBody = (e: MouseEvent) => {
      if (!elementWrapper.current || !targetWrapper.current) return;

      const node = e.target as Node;
      if (!elementWrapper.current.contains(node) && !targetWrapper.current.contains(node)) {
        close();
      }
    };

    setTimeout(() => {
      document.body.addEventListener("click", handleClickBody);
    }, 0);
    return () => {
      document.body.removeEventListener("click", handleClickBody);
    };
  }, [close]);

  return (
    <TetherComponent
      attachment="top left"
      targetAttachment="top left"
      className={`data-cell-edition data-cell-edition-${field.type}`}
      constraints={[{ to: "scrollParent", attachment: "together", pin: true }]}
      renderTarget={(ref) => (
        <div ref={ref}>
          <ReadDataCell ref={targetWrapper} value={value} field={field} />
        </div>
      )}
      renderElement={(ref) => (
        <div
          ref={ref}
          style={{
            minWidth: Math.max(200, targetWrapper?.current?.offsetWidth ?? 0),
          }}
        >
          <form
            ref={elementWrapper}
            onSubmit={(e) => {
              e.preventDefault();
              commit(value);
              close();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                close();
                return;
              }
              const direction = ARROW_KEY_DIRECTIONS[e.key];
              if (direction && ARROW_NAV_FIELD_TYPES.includes(field.type)) {
                e.preventDefault();
                commit(value);
                close();
                moveTo({ rowId: id, columnId }, direction);
              }
            }}
          >
            <EditItemAttribute autoFocus inTooltip field={field} scalar={value} onChange={(value) => setValue(value)} />
            <div className="data-cell-edition-actions">
              <button type="submit" className="gl-btn gl-btn-fill gl-btn-icon" title={t("datatable.save_cell")}>
                <PiCheck />
              </button>
              <button
                type="button"
                className="gl-btn gl-btn-outline gl-btn-icon"
                title={t("datatable.cancel_cell")}
                onClick={() => close()}
              >
                <CancelIcon />
              </button>
            </div>
          </form>
        </div>
      )}
    />
  );
};

export const DataCell: FC<{
  type: ItemType;
  id: string;
  field: FieldModel<ItemType, boolean>;
  value: Scalar;
  readOnly?: boolean;
  columnId: string;
}> = (props) => {
  const { readOnly, id, columnId, field } = props;
  const [isEditing, setIsEditing] = useState(false);
  const { activeCell, clearActiveCell } = useDataCellNavigation();

  // Auto-enter edit mode when arrow-key navigation (see EditDataCell) targets this cell - including
  // when it was just mounted after being scrolled into view (see DataTable's moveTo). Clearing the
  // request right after consuming it keeps it from lingering: react-virtual recycles row DOM nodes,
  // so an un-cleared request could pop this same cell back into edit mode after an unrelated remount.
  useEffect(() => {
    if (!readOnly && activeCell?.rowId === id && activeCell?.columnId === columnId) {
      setIsEditing(true);
      clearActiveCell();
    }
  }, [activeCell, readOnly, id, columnId, clearActiveCell]);

  // Editable boolean fields are directly edited inline:
  if (field.type === "boolean" && !readOnly) {
    return <InlineEditDataCell {...props} />;
  }

  return !isEditing ? (
    <ReadDataCell {...props} onClick={!readOnly ? () => setIsEditing(true) : undefined} />
  ) : (
    <EditDataCell {...props} close={() => setIsEditing(false)} />
  );
};
