import { FC, useState } from "react";

import { AttributeSelect } from "../forms/AttributeSelect";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";
import { ItemType } from "../../core/types";
import { useTranslation } from "react-i18next";

export interface Attribute {
  id: string;
  qualitative?: boolean;
  quantitative?: boolean;
}

export const GraphPartitioningForm: FC<{
  itemType: ItemType;
  partitionAttributeId: string | undefined;
  setPartitionAttributeId: (nodeAttId: string | undefined) => void;
  closeForm: () => void;
}> = ({ itemType, partitionAttributeId, setPartitionAttributeId, closeForm }) => {
  const { t } = useTranslation();
  const [newPartAttId, setNewPartAttId] = useState<string | undefined>();

  return (
    <form>
      <div>
        <label>
          {t("graph.partitioning.partition", {
            items: itemType === "nodes" ? t("graph.model.nodes") : t("graph.model.edges"),
          })}
        </label>
        <AttributeSelect
          attributeId={newPartAttId}
          itemType={itemType}
          attributesFilter={(a) => !!a.qualitative && a.id !== partitionAttributeId}
          onChange={setNewPartAttId}
        />
        {newPartAttId && <GraphPartitioningStatus partitionAttributeId={newPartAttId} preview itemType={itemType} />}
        <div>
          <button
            className="btn btn-primary"
            type="submit"
            onClick={() => {
              closeForm();
            }}
          >
            {t("button.cancel")}
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
            {t("button.confirm")}
          </button>
        </div>
      </div>
    </form>
  );
};
