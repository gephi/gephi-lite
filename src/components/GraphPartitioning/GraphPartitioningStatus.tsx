import { t } from "i18next";
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
        {t("graph.partitioning.status_item", {
          context: preview && "preview",
          items: itemType === "nodes" ? t("graph.model.nodes") : t("graph.model.edges"),
        })}{" "}
        {t("graph.partitioning.status_partition", {
          nbPartitions: attributeStats?.nbValues + (attributeStats?.nbMissingValues !== 0 ? 1 : 0),
          attribute: partitionAttributeId,
        })}
      </div>
      {attributeStats?.nbMissingValues !== 0 && (
        <div>
          <IoWarning />{" "}
          {t("graph.partitioning.warning_nbMissing", {
            nbMissingValues: attributeStats?.nbMissingValues,
            items: itemType === "nodes" ? t("graph.model.nodes") : t("graph.model.edges"),
          })}
          <br />
          {t("graph.partitioning.missing_partition", { context: preview && "preview" })}
        </div>
      )}
    </div>
  );
};
