import { FC, useState } from "react";
import { GraphPartitioningForm } from "./GraphPartitioningForm";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";

export const GraphPartitioning: FC = () => {
  //TODO: repalce by context
  const [nodePartitionAttributeId, setNodePartitionAttributeId] = useState<
    string | undefined
  >(undefined);

  const [editingNodePartition, setEditingNodePartition] =
    useState<boolean>(false);
  if (editingNodePartition)
    return (
      <GraphPartitioningForm
        nodePartitionAttributeId={nodePartitionAttributeId}
        setNodePartitionAttributeId={setNodePartitionAttributeId}
        closeForm={() => setEditingNodePartition(false)}
      />
    );
  return (
    <div>
      {nodePartitionAttributeId === undefined ? (
        <>
          <div>The graph is not partitioned</div>
          <div>
            To apply appearance or filters differently on different groups of
            nodes,
            <br />
            partition your graph using any node qualitative attribute.
          </div>
        </>
      ) : (
        <GraphPartitioningStatus
          nodePartitionAttributeId={nodePartitionAttributeId}
        />
      )}
      <div>
        {nodePartitionAttributeId && (
          <button
            className="btn btn-primary"
            onClick={() => setNodePartitionAttributeId(undefined)}
          >
            remove
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={() => setEditingNodePartition(!editingNodePartition)}
        >
          {nodePartitionAttributeId ? "change" : "partition"}
        </button>
      </div>
    </div>
  );
};
