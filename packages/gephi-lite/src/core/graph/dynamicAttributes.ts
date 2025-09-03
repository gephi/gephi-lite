import {
  DynamicItemsDataSpec,
  FieldModel,
  ItemData,
  ItemType,
  Scalar,
  StaticDynamicItemData,
} from "@gephi/gephi-lite-sdk";
import { t } from "i18next";
import { fromPairs, mapValues, values } from "lodash";

import { DatalessGraph } from "./types";

/**
 * Dynamic attributes are recomputed at every graph topology change.
 * Do not add heavy or random-based one in dynamic attribute!
 */

// 1. add your new dynamic attribute id here
export type DYNAMIC_NODE_ATTRIBUTE_ENUM = "degree";
export type DYNAMIC_EDGE_ATTRIBUTE_ENUM = "selfLoop" | "directed";

// 2. describe it here
export const dynamicAttributes: DynamicItemsDataSpec<DYNAMIC_NODE_ATTRIBUTE_ENUM, DYNAMIC_EDGE_ATTRIBUTE_ENUM> = {
  nodes: {
    degree: {
      i18nKey: "graph.model.degree",
      field: { id: "degree", itemType: "nodes", type: "number", dynamic: true },
      compute: (nodeId: string, graph: DatalessGraph) => {
        return graph.degree(nodeId);
      },
      showInDataTable: true,
    },
  },
  edges: {
    selfLoop: {
      i18nKey: "graph.model.selfLoop",
      field: { id: "selfLoop", itemType: "edges", type: "category", dynamic: true },
      compute: (edgeId: string, graph: DatalessGraph) => {
        //TODO: boolean field
        return graph.isSelfLoop(edgeId) ? "true" : "false";
      },
      showInDataTable: (fullGraph: DatalessGraph) => fullGraph.selfLoopCount > 0,
    },

    directed: {
      i18nKey: "graph.model.directed",
      field: { id: "directed", itemType: "edges", type: "category", dynamic: true },
      //TODO: updates an edge manually does not trigger this computation
      compute: (edgeId: string, graph: DatalessGraph) => {
        //TODO: boolean field
        return graph.isDirected(edgeId) ? "true" : "false";
      },
      showInDataTable: (fullGraph: DatalessGraph) => {
        console.log("graph type", fullGraph.type);
        return fullGraph.type === "mixed";
      },
    },
  },
};

export const computeAllDynamicAttributes = (itemType: ItemType, graph: DatalessGraph) => {
  const itemData = fromPairs(
    graph[itemType]().map((n) => {
      return [
        n, // keyby itemid
        values(dynamicAttributes[itemType]).reduce(
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

export const staticDynamicAttributeLabel = (field: FieldModel<ItemType, boolean>) => {
  if (field.dynamic) {
    return `${t(`graph.model.${field.id}`)} (${t("graph.model.dynamic")})`;
  }
  return field.label || field.id;
};

export function getScalarFromStaticDynamicData(
  data: StaticDynamicItemData,
  field: Pick<FieldModel<ItemType, boolean>, "id" | "dynamic">,
): Scalar {
  return field.dynamic ? data.dynamic[field.id] : data.static[field.id];
}
