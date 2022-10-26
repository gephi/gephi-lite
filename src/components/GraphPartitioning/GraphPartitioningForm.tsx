import { FC, useState } from "react";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";

interface NodeAttribute {
  id: string;
  qualitative?: boolean;
  quantitative?: boolean;
}

const nodeAttributes: NodeAttribute[] = [
  { id: "att_dual", qualitative: true, quantitative: true },
  { id: "att_quanti", qualitative: false, quantitative: true },
  { id: "att_quali", qualitative: true, quantitative: false },
];

export const GraphPartitioningForm: FC<{
  nodePartitionAttributeId: string | undefined;
  setNodePartitionAttributeId: (nodeAttId: string | undefined) => void;
  closeForm: () => void;
}> = ({ nodePartitionAttributeId, setNodePartitionAttributeId, closeForm }) => {
  const [newNodePartAttId, setNewNodePartAttId] = useState<string | undefined>(
    nodePartitionAttributeId
  );
  return (
    <form>
      <div>
        <label>Partition nodes on</label>
        <select
          className="form-select"
          value={newNodePartAttId || ""}
          onChange={(e) =>
            setNewNodePartAttId(
              e.target.value === "" ? undefined : e.target.value
            )
          }
        >
          <option value="">Select a node attribute</option>
          {nodeAttributes
            .filter((na) => na.qualitative)
            .map((na) => (
              <option key={na.id} value={na.id}>
                {na.id}
              </option>
            ))}
        </select>
        {newNodePartAttId && (
          <GraphPartitioningStatus
            nodePartitionAttributeId={newNodePartAttId}
            preview
          />
        )}
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
            disabled={newNodePartAttId === nodePartitionAttributeId}
            onClick={() => {
              setNodePartitionAttributeId(newNodePartAttId);
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
