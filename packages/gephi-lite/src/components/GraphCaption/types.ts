import { FieldModel, ItemType, StaticDynamicItemData } from "@gephi/gephi-lite-sdk";

export interface GraphCaptionProps {
  minimal?: boolean;
}

export interface RangeExtends {
  field: FieldModel<ItemType, boolean>;
  min: number;
  minValue: StaticDynamicItemData;
  max: number;
  maxItemData: StaticDynamicItemData;
  getLabel: (valueAsNumber: number, extendSize?: number) => string;
  missing?: boolean;
}
export type PartitionExtends = {
  field: FieldModel<ItemType, boolean>;
  occurrences: Record<string, number>;
  missing?: boolean;
};
