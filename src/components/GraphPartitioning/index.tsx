import { FC, useEffect, useState } from "react";
import { NodeEdgeTabs } from "../forms/NodeEdgeTabs";
import { GraphPartitioningForm } from "./GraphPartitioningForm";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";

export const GraphPartitioning: FC = () => {
  return (
    <NodeEdgeTabs>
      <GraphItemPartitioning />
    </NodeEdgeTabs>
  );
};

const GraphItemPartitioning: FC<{ nodeEdge?: "node" | "edge" }> = ({ nodeEdge }) => {
  useEffect(() => {
    setEditingNodePartition(false);
    setPartitionAttributeId(undefined);
  }, [nodeEdge]);
  //TODO: repalce by context
  const [partitionAttributeId, setPartitionAttributeId] = useState<string | undefined>(undefined);
  const [editingNodePartition, setEditingNodePartition] = useState<boolean>(false);
  const itemsLabel = (nodeEdge || "node") + "s"; // add translator here
  return (
    <div>
      {partitionAttributeId === undefined ? (
        <>
          <div>{itemsLabel} are not partitioned</div>
          <div>
            To apply appearance or filters differently on different groups of {itemsLabel},
            <br />
            partition your graph using any node qualitative attribute.
          </div>
        </>
      ) : (
        <GraphPartitioningStatus nodeEdge={nodeEdge} partitionAttributeId={partitionAttributeId} />
      )}
      <div>
        {partitionAttributeId && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setPartitionAttributeId(undefined);
              setEditingNodePartition(false);
            }}
          >
            remove
          </button>
        )}
        <button className="btn btn-primary" onClick={() => setEditingNodePartition(!editingNodePartition)}>
          {partitionAttributeId ? "edit" : "partition"}
        </button>
      </div>
      {editingNodePartition && (
        <GraphPartitioningForm
          nodeEdge={nodeEdge}
          partitionAttributeId={partitionAttributeId}
          setPartitionAttributeId={setPartitionAttributeId}
          closeForm={() => setEditingNodePartition(false)}
        />
      )}
    </div>
  );
};
