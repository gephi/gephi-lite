import { FC, useEffect, useState } from "react";
import { Tabs } from "../Tabs";
import { GraphPartitioningForm } from "./GraphPartitioningForm";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";
import { ItemType } from "../../core/types";

export const GraphPartitioning: FC = () => {
  return (
    <Tabs>
      <>Nodes</>
      <GraphItemPartitioning itemType="nodes" />
      <>Edges</>
      <GraphItemPartitioning itemType="edges" />
    </Tabs>
  );
};

const GraphItemPartitioning: FC<{ itemType: ItemType }> = ({ itemType }) => {
  useEffect(() => {
    setEditingNodePartition(false);
    setPartitionAttributeId(undefined);
  }, [itemType]);
  //TODO: replace by context
  const [partitionAttributeId, setPartitionAttributeId] = useState<string | undefined>(undefined);
  const [editingNodePartition, setEditingNodePartition] = useState<boolean>(false);
  return (
    <div>
      {partitionAttributeId === undefined ? (
        <>
          <div>{itemType} are not partitioned</div>
          <div>
            To apply appearance or filters differently on different groups of {itemType},
            <br />
            partition your graph using any node qualitative attribute.
          </div>
        </>
      ) : (
        <GraphPartitioningStatus itemType={itemType} partitionAttributeId={partitionAttributeId} />
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
          itemType={itemType}
          partitionAttributeId={partitionAttributeId}
          setPartitionAttributeId={setPartitionAttributeId}
          closeForm={() => setEditingNodePartition(false)}
        />
      )}
    </div>
  );
};
