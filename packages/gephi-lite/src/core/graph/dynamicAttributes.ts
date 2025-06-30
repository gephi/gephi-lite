import {
  DynamicItemsDataSpec,
  FieldModel,
  ItemData,
  ItemType,
  Scalar,
  StaticDynamicItemData,
} from "@gephi/gephi-lite-sdk";
import { fromPairs, mapValues } from "lodash";

import { DatalessGraph } from "./types";

/**
 * Dynamic attributes are recomputed at every graph topology change.
 * Do not add heavy or random-based one in dynamic attribute!
 */
export const dynamicAttributes: DynamicItemsDataSpec = {
  nodes: [
    {
      field: { id: "degree", itemType: "nodes", type: "number", dynamic: true },
      compute: (nodeId: string, graph: DatalessGraph) => {
        return graph.degree(nodeId);
      },
    },
  ],
  edges: [],
};

export const computeAllDynamicAttributes = (itemType: ItemType, graph: DatalessGraph) => {
  const itemData = fromPairs(
    graph[itemType]().map((n) => {
      return [
        n, // keyby itemid
        dynamicAttributes[itemType].reduce(
          (result, dan) => {
            return { ...result, [dan.field.id]: dan.compute(n, graph) };
          },
          {} as Record<string, Scalar>,
        ), // reduce sepcs to an object {id: value}
      ];
    }),
  );
  return itemData;
};

export const mergeStaticDynamicData = (
  staticData: Record<string, ItemData>,
  dynamicData: Record<string, ItemData>,
): Record<string, StaticDynamicItemData> => {
  return mapValues(staticData, (staticItemData, id) => ({ static: staticItemData, dynamic: dynamicData[id] || {} }));
};

export const staticDynamicAttributeKey = (field: FieldModel<ItemType, boolean>) =>
  `${field.dynamic ? "dynamic" : "static"}.${field.id}`;

export const staticDynamicAttributeLabel = (field: FieldModel<ItemType, boolean>) =>
  `${field.id} ${field.dynamic ? " (dynamic)" : ""}`;

export function getScalarFromStaticDynamicData(
  data: StaticDynamicItemData,
  field: Pick<FieldModel<ItemType, boolean>, "id" | "dynamic">,
): Scalar {
  return field.dynamic ? data.dynamic[field.id] : data.static[field.id];
}
