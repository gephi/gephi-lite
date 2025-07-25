import { FieldModel, ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import { FC, MouseEventHandler, forwardRef, useEffect, useRef, useState } from "react";
import { PiCheck } from "react-icons/pi";
import TetherComponent from "react-tether";

import { EditItemAttribute, RenderItemAttribute } from "../../../components/data/Attribute";
import { useGraphDatasetActions } from "../../../core/context/dataContexts";

export const ReadDataCell = forwardRef<
  HTMLSpanElement,
  { value: Scalar; field: FieldModel; onClick?: MouseEventHandler }
>(({ value, field, onClick }, ref) => {
  return (
    <span ref={ref} className="data-cell" onClick={onClick}>
      <RenderItemAttribute value={value} field={field} />
    </span>
  );
});

export const EditDataCell: FC<{
  type: ItemType;
  id: string;
  field: FieldModel;
  value: Scalar;
  close: () => void;
}> = ({ type, id, field, close, value: initialValue }) => {
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
              update(id, { [field.id]: value }, { merge: true });
              close();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                close();
              }
            }}
          >
            <EditItemAttribute autoFocus inTooltip field={field} scalar={value} onChange={(value) => setValue(value)} />
            <button className="gl-btn gl-btn-fill gl-btn-icon">
              <PiCheck />
            </button>
          </form>
        </div>
      )}
    />
  );
};

export const DataCell: FC<{ type: ItemType; id: string; field: FieldModel; value: Scalar }> = (props) => {
  const [isEditing, setIsEditing] = useState(false);

  return !isEditing ? (
    <ReadDataCell {...props} onClick={() => setIsEditing(true)} />
  ) : (
    <EditDataCell {...props} close={() => setIsEditing(false)} />
  );
};
