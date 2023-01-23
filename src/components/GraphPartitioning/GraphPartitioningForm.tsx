import { FC, useState } from "react";

import { AttributeSelect } from "../forms/AttributeSelect";
import { GraphPartitioningStatus } from "./GraphPartitioningStatus";
import { ItemType } from "../../core/types";

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
  const [newPartAttId, setNewPartAttId] = useState<string | undefined>();

  return (
    <form>
      <div>
        <label>Partition {itemType} on</label>
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
            cancel
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
            confirm
          </button>
        </div>
      </div>
    </form>
  );
};
