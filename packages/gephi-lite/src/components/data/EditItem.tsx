import { ItemType } from "@gephi/gephi-lite-sdk";
import { FC } from "react";

import { ModalProps } from "../../core/modals/types";
import { EditEdgeForm, EditEdgeModal } from "./EditEdge";
import { EditNodeForm, EditNodeModal } from "./EditNode";

export const EditItemModal: FC<
  ModalProps<{
    type: ItemType;
    itemId?: string;
  }>
> = ({ arguments: { type, itemId }, ...props }) => {
  return type === "nodes" ? (
    <EditNodeModal {...props} arguments={{ nodeId: itemId }} />
  ) : (
    <EditEdgeModal {...props} arguments={{ edgeId: itemId }} />
  );
};

export const EditItemForm: FC<{
  type: ItemType;
  itemId?: string;
  onSubmitted: () => void;
  onCancel: () => void;
}> = ({ type, itemId, onSubmitted, onCancel }) => {
  return type === "nodes" ? (
    <EditNodeForm nodeId={itemId} onSubmitted={onSubmitted} onCancel={onCancel} />
  ) : (
    <EditEdgeForm edgeId={itemId} onSubmitted={onSubmitted} onCancel={onCancel} />
  );
};
