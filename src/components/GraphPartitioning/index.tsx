import { FC, useEffect, useState } from "react";
import { Tabs } from "../Tabs";
import { GraphPartitioningForm } from "./GraphPartitioningForm";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";
import { ItemType } from "../../core/types";
import { useTranslation } from "react-i18next";

export const GraphPartitioning: FC = () => {
  const { t } = useTranslation();
  return (
    <Tabs>
      {t("graph.model.nodes")}
      <GraphItemPartitioning itemType="nodes" />
      {t("graph.model.edges")}
      <GraphItemPartitioning itemType="edges" />
    </Tabs>
  );
};

const GraphItemPartitioning: FC<{ itemType: ItemType }> = ({ itemType }) => {
  useEffect(() => {
    setEditingNodePartition(false);
    setPartitionAttributeId(undefined);
  }, [itemType]);
  const { t } = useTranslation();
  //TODO: replace by context
  const [partitionAttributeId, setPartitionAttributeId] = useState<string | undefined>(undefined);
  const [editingNodePartition, setEditingNodePartition] = useState<boolean>(false);
  return (
    <div>
      {partitionAttributeId === undefined ? (
        <>
          <div>
            {t("graph.partitioning.status_no_partition", {
              items: itemType === "nodes" ? t("graph.model.nodes") : t("graph.model.edges"),
            })}
          </div>
          <div>
            {t("graph.partitioning.description", {
              items: itemType === "nodes" ? t("graph.model.nodes") : t("graph.model.edges"),
            })}
          </div>
        </>
      ) : (
        <GraphPartitioningStatus itemType={itemType} partitionAttributeId={partitionAttributeId} />
      )}
      <div>
        {partitionAttributeId && (
          <button
            className="btn btn-primary"
            title={t("common.remove").toString()}
            onClick={() => {
              setPartitionAttributeId(undefined);
              setEditingNodePartition(false);
            }}
          >
            {t("common.remove")}
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
