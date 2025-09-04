import { FieldModel, ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { isNil } from "lodash";
import { FC, MouseEventHandler, forwardRef, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiCheck } from "react-icons/pi";
import TetherComponent from "react-tether";

import { EditItemAttribute, RenderItemAttribute } from "../../../components/data/Attribute";
import { useGraphDatasetActions } from "../../../core/context/dataContexts";

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
  close: () => void;
}> = ({ type, id, field, close, value: initialValue }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<Scalar>(initialValue);
  const { updateNode, updateEdge } = useGraphDatasetActions();
  const update = type === "nodes" ? updateNode : updateEdge;

  const targetWrapper = useRef<HTMLDivElement>(null);
  const elementWrapper = useRef<HTMLFormElement>(null);

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
              if (field.dynamic) {
                update(id, {}, { merge: true, [field.id]: value });
              } else {
                update(id, { [field.id]: value }, { merge: true });
              }
              close();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                close();
              }
            }}
          >
            <EditItemAttribute autoFocus inTooltip field={field} scalar={value} onChange={(value) => setValue(value)} />
            <button className="gl-btn gl-btn-fill gl-btn-icon" title={t("datatable.save_cell")}>
              <PiCheck />
            </button>
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
}> = (props) => {
  const { readOnly } = props;
  const [isEditing, setIsEditing] = useState(false);

  // Editable boolean fields are directly edited inline:
  if (props.field.type === "boolean" && !readOnly) {
    return <InlineEditDataCell {...props} />;
  }

  return !isEditing ? (
    <ReadDataCell {...props} onClick={!readOnly ? () => setIsEditing(true) : undefined} />
  ) : (
    <EditDataCell {...props} close={() => setIsEditing(false)} />
  );
};
