import { ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import { FC, MouseEventHandler, forwardRef, useEffect, useRef, useState } from "react";
import ReactLinkify from "react-linkify";
import TetherComponent from "react-tether";

import { useGraphDatasetActions } from "../../../core/context/dataContexts";
import { DEFAULT_LINKIFY_PROPS } from "../../../utils/url";

export const ReadDataCell = forwardRef<HTMLSpanElement, { value: Scalar; onDoubleClick?: MouseEventHandler }>(
  ({ value, onDoubleClick }, ref) => {
    return (
      <span ref={ref} className="data-cell" onDoubleClick={onDoubleClick}>
        <ReactLinkify {...DEFAULT_LINKIFY_PROPS}>{value}</ReactLinkify>
      </span>
    );
  },
);

export const EditDataCell: FC<{ type: ItemType; id: string; field: string; value: Scalar; close: () => void }> = ({
  type,
  id,
  field,
  close,
  value: initialValue,
}) => {
  const [value, setValue] = useState(initialValue + "");
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
      className=""
      constraints={[{ to: "scrollparent", attachment: "together", pin: true }]}
      renderTarget={(ref) => (
        <div ref={ref}>
          <ReadDataCell ref={targetWrapper} value={value} />
        </div>
      )}
      renderElement={(ref) => (
        <div ref={ref}>
          <form
            ref={elementWrapper}
            className="bg-light"
            onSubmit={(e) => {
              e.preventDefault();
              update(id, { [field]: value }, { merge: true });
              close();
            }}
          >
            <textarea autoFocus className="form-control" value={value} onChange={(e) => setValue(e.target.value)} />
            <div className="text-end">
              <button className="btn btn-small">Save cell</button>
            </div>
          </form>
        </div>
      )}
    />
  );
};

export const DataCell: FC<{ type: ItemType; id: string; field: string; value: Scalar }> = (props) => {
  const [isEditing, setIsEditing] = useState(false);

  return !isEditing ? (
    <ReadDataCell value={props.value} onDoubleClick={() => setIsEditing(true)} />
  ) : (
    <EditDataCell {...props} close={() => setIsEditing(false)} />
  );
};
