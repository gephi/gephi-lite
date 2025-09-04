import { FieldModel, ItemType } from "@gephi/gephi-lite-sdk";
import { isNil } from "lodash";
import { useMemo } from "react";

import { useGraphDataset } from "../core/context/dataContexts";
import { castScalarToModelValue } from "../core/graph/fieldModel";

export function useDataCollection(field: FieldModel<ItemType, boolean>) {
  const { nodeData, edgeData } = useGraphDataset();
  const data = useMemo(() => (field.itemType === "nodes" ? nodeData : edgeData), [field.itemType, nodeData, edgeData]);

  return useMemo(() => {
    const values = new Set<string>();
    switch (field.type) {
      case "category": {
        for (const itemId in data) {
          const category = castScalarToModelValue<"category">(data[itemId][field.id], field);
          if (!isNil(category)) values.add(category);
        }
        break;
      }
      case "keywords": {
        for (const itemId in data) {
          const keywords = castScalarToModelValue<"keywords">(data[itemId][field.id], field) || [];
          for (let i = 0; i < keywords.length; i++) {
            if (!isNil(keywords[i])) values.add(keywords[i]);
          }
        }
        break;
      }
    }
    return values;
  }, [data, field]);
}
