import { FC } from "react";
import { IoWarning } from "react-icons/io5";

// TODO: MOVE TO CONTEXT
type NodeAttributeValueStatistics = Record<
  string,
  { nbValues: number; nbMissingValues: number }
>;
const nodeAttributesIndex: NodeAttributeValueStatistics = {
  att_dual: { nbValues: 23, nbMissingValues: 0 },
  att_quali: { nbValues: 3, nbMissingValues: 100 },
};

export const GraphPartitioningStatus: FC<{
  nodePartitionAttributeId: string;
  preview?: boolean;
}> = ({ nodePartitionAttributeId, preview }) => {
  return (
    <div className="d-flex flex-column">
      <div>
        The graph {preview ? "will have" : "has"}{" "}
        {nodeAttributesIndex[nodePartitionAttributeId]?.nbValues +
          (nodeAttributesIndex[nodePartitionAttributeId]?.nbMissingValues !== 0
            ? 1
            : 0)}{" "}
        partitions using {nodePartitionAttributeId} attribute
      </div>
      {nodeAttributesIndex[nodePartitionAttributeId]?.nbMissingValues !== 0 && (
        <div>
          <IoWarning />{" "}
          {nodeAttributesIndex[nodePartitionAttributeId]?.nbMissingValues} nodes
          don't have a value for this attribute.
          <br />
          They {preview ? "will be" : "are"} partioned into a 'missing value'
          group.
        </div>
      )}
    </div>
  );
};
