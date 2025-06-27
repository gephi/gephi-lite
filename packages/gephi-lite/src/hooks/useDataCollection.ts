import { FieldModel } from "@gephi/gephi-lite-sdk";
import { useMemo } from "react";

import { useGraphDataset } from "../core/context/dataContexts";
import { castScalarToModelValue } from "../core/graph/fieldModel";

export function useDataCollection(field: FieldModel) {
  const { nodeData, edgeData } = useGraphDataset();
  const data = useMemo(() => (field.itemType === "nodes" ? nodeData : edgeData), [field.itemType, nodeData, edgeData]);

  return useMemo(() => {
    const values = new Set<string>();
    switch (field.type) {
      case "category": {
        for (const itemId in data) {
          const category = castScalarToModelValue<"category">(data[itemId][field.id], field);
          values.add(category);
        }
        break;
      }
      case "keywords": {
        for (const itemId in data) {
          const keywords = castScalarToModelValue<"keywords">(data[itemId][field.id], field);
          for (let i = 0; i < keywords.length; i++) values.add(keywords[i]);
        }
        break;
      }
    }
    return values;
  }, [data, field]);
}
