import {
  DynamicItemDataSpec,
  DynamicItemsDataSpec,
  FieldModel,
  ItemData,
  ItemType,
  Scalar,
  StaticDynamicItemData,
} from "@gephi/gephi-lite-sdk";
import { t } from "i18next";
import { fromPairs, mapValues } from "lodash";

// import { graphDatasetActions } from "./index";
import { DatalessGraph } from "./types";

/**
 * Dynamic attributes are recomputed at every graph topology change.
 * Do not add heavy or random-based one in dynamic attribute!
 */

// 1. add your new dynamic attribute id here
export type DynamicNodeAttributeId = "degree";
export type DynamicEdgeAttributeId = "selfLoop" | "directed";
export type EditableDynamicEdgeAttributeId = "directed";

// 2. describe it here
export const DYNAMIC_ATTRIBUTES: DynamicItemsDataSpec<DynamicNodeAttributeId, DynamicEdgeAttributeId> = {
  nodes: {
    degree: {
      i18nKey: "graph.model.degree",
      field: { id: "degree", itemType: "nodes", type: "number", dynamic: true },
      compute: (nodeId: string, graph: DatalessGraph) => graph.degree(nodeId),
      showInDataTable: true,
    },
  },
  edges: {
    selfLoop: {
      i18nKey: "graph.model.selfLoop",
      field: { id: "selfLoop", itemType: "edges", type: "boolean", dynamic: true },
      compute: (edgeId: string, graph: DatalessGraph) => graph.isSelfLoop(edgeId),
      showInDataTable: (fullGraph: DatalessGraph) => fullGraph.selfLoopCount > 0,
    },

    directed: {
      i18nKey: "graph.model.directed",
      field: { id: "directed", itemType: "edges", type: "boolean", dynamic: true },
      compute: (edgeId: string, graph: DatalessGraph) => graph.isDirected(edgeId),
      showInDataTable: (fullGraph: DatalessGraph) => fullGraph.type === "mixed",
      editable: true,
    },
  },
};

export const computeAllDynamicAttributes = <T extends ItemType>(itemType: T, graph: DatalessGraph) =>
  fromPairs(
    graph[itemType]().map((itemId) => [
      itemId,
      mapValues(DYNAMIC_ATTRIBUTES[itemType], ({ compute }: DynamicItemDataSpec<T>) => compute(itemId, graph)),
    ]),
  );

export const mergeStaticDynamicData = (
  staticData: Record<string, ItemData>,
  dynamicData: Record<string, ItemData>,
): Record<string, StaticDynamicItemData> => {
  return mapValues(staticData, (staticItemData, id) => ({
    static: staticItemData || {},
    dynamic: dynamicData[id] || {},
  }));
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
