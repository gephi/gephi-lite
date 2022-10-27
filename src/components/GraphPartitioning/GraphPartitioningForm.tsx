import { FC, useState } from "react";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";

export interface Attribute {
  id: string;
  qualitative?: boolean;
  quantitative?: boolean;
}

const nodeAttributes: Attribute[] = [
  { id: "att_dual", qualitative: true, quantitative: true },
  { id: "att_quanti", qualitative: false, quantitative: true },
  { id: "att_quali", qualitative: true, quantitative: false },
];
const edgeAttributes: Attribute[] = [
  { id: "weight", qualitative: false, quantitative: true },
  { id: "type", qualitative: true, quantitative: false },
];

export const GraphPartitioningForm: FC<{
  nodeEdge?: "node" | "edge";
  partitionAttributeId: string | undefined;
  setPartitionAttributeId: (nodeAttId: string | undefined) => void;
  closeForm: () => void;
}> = ({ nodeEdge, partitionAttributeId, setPartitionAttributeId, closeForm }) => {
  const itemLabel = (nodeEdge || "node") + "s"; // add translator here
  const attributes = (!nodeEdge || nodeEdge === "node" ? nodeAttributes : edgeAttributes).filter(
    (a) => a.id !== partitionAttributeId,
  );

  const [newPartAttId, setNewPartAttId] = useState<string | undefined>(attributes[0]?.id);

  return (
    <form>
      <div>
        <label>Partition {itemLabel} on</label>
        <select
          className="form-select"
          value={newPartAttId || ""}
          onChange={(e) => setNewPartAttId(e.target.value === "" ? undefined : e.target.value)}
        >
          {attributes
            .filter((na) => na.qualitative)
            .map((na) => (
              <option key={na.id} value={na.id}>
                {na.id}
              </option>
            ))}
        </select>
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
