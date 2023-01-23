import { FC } from "react";
import { IoWarning } from "react-icons/io5";
import { ItemType } from "../../core/types";

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

export const GraphPartitioningStatus: FC<{
  itemType: ItemType;
  partitionAttributeId: string;
  preview?: boolean;
}> = ({ itemType, partitionAttributeId, preview }) => {
  const attributeStats =
    itemType === "nodes" ? nodeAttributesIndex[partitionAttributeId] : edgeAttributesIndex[partitionAttributeId];
  return (
    <div className="d-flex flex-column">
      <div>
        The {itemType} {preview ? "will be" : "are"} grouped into{" "}
        {attributeStats?.nbValues + (attributeStats?.nbMissingValues !== 0 ? 1 : 0)} partitions using{" "}
        {partitionAttributeId} attribute
      </div>
      {attributeStats?.nbMissingValues !== 0 && (
        <div>
          <IoWarning /> {attributeStats?.nbMissingValues} {itemType} don't have a value for this attribute.
          <br />
          They {preview ? "will be" : "are"} grouped into a 'missing value' partition.
        </div>
      )}
    </div>
  );
};
