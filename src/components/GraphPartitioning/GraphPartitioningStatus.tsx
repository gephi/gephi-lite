import { FC } from "react";
import { IoWarning } from "react-icons/io5";
import { NodeEdgeProps } from "../forms/NodeEdgeTabs";

// TODO: MOVE TO CONTEXT
type AttributeValueStatistics = Record<string, { nbValues: number; nbMissingValues: number }>;
const nodeAttributesIndex: AttributeValueStatistics = {
  att_dual: { nbValues: 23, nbMissingValues: 0 },
  att_quali: { nbValues: 3, nbMissingValues: 100 },
};
const edgeAttributesIndex: AttributeValueStatistics = {
  weight: { nbValues: 23, nbMissingValues: 0 },
  type: { nbValues: 2, nbMissingValues: 3 },
};

export const GraphPartitioningStatus: FC<
  NodeEdgeProps & {
    partitionAttributeId: string;
    preview?: boolean;
  }
> = ({ nodeEdge, partitionAttributeId, preview }) => {
  const attributeStats =
    nodeEdge === "nodes" ? nodeAttributesIndex[partitionAttributeId] : edgeAttributesIndex[partitionAttributeId];
  const itemLabel = nodeEdge + "s"; // add translator here
  return (
    <div className="d-flex flex-column">
      <div>
        The {itemLabel} {preview ? "will be" : "are"} grouped into{" "}
        {attributeStats?.nbValues + (attributeStats?.nbMissingValues !== 0 ? 1 : 0)} partitions using{" "}
        {partitionAttributeId} attribute
      </div>
      {attributeStats?.nbMissingValues !== 0 && (
        <div>
          <IoWarning /> {attributeStats?.nbMissingValues} {itemLabel} don't have a value for this attribute.
          <br />
          They {preview ? "will be" : "are"} grouped into a 'missing value' partition.
        </div>
      )}
    </div>
  );
};
