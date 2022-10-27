import { FC, useState } from "react";
import { AttributeSelect } from "../forms/AttributeSelect";
import { NodeEdgeProps } from "../forms/NodeEdgeTabs";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";

export interface Attribute {
  id: string;
  qualitative?: boolean;
  quantitative?: boolean;
}

export const GraphPartitioningForm: FC<
  NodeEdgeProps & {
    partitionAttributeId: string | undefined;
    setPartitionAttributeId: (nodeAttId: string | undefined) => void;
    closeForm: () => void;
  }
> = ({ nodeEdge, partitionAttributeId, setPartitionAttributeId, closeForm }) => {
  const itemLabel = nodeEdge + "s"; // add translator here
  const [newPartAttId, setNewPartAttId] = useState<string | undefined>();

  return (
    <form>
      <div>
        <label>Partition {itemLabel} on</label>
        <AttributeSelect
          attributeId={newPartAttId}
          nodeEdge={nodeEdge}
          attributesFilter={(a) => !!a.qualitative && a.id !== partitionAttributeId}
          onChange={setNewPartAttId}
        />
        {newPartAttId && <GraphPartitioningStatus partitionAttributeId={newPartAttId} preview nodeEdge={nodeEdge} />}
        <div>
          <button
            className="btn btn-primary"
            type="submit"
            onClick={() => {
              closeForm();
            }}
          >
            cancel
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={newPartAttId === partitionAttributeId}
            onClick={() => {
              setPartitionAttributeId(newPartAttId);
              closeForm();
            }}
          >
            confirm
          </button>
        </div>
      </div>
    </form>
  );
};
