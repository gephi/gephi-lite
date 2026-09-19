import {
  DynamicItemDataSpec,
  DynamicItemsDataSpec,
  FieldModel,
  FullGraph,
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

/**
 * Computes the value of every "formula" (scripted) field, for every item of the given full graph.
 * Returns a map { [itemId]: { [fieldId]: value } }, so it can be merged with the topology-based
 * dynamic attributes. A failing script never breaks the whole computation: the faulty cell is left
 * undefined.
 */
export const computeScriptFieldsData = <T extends ItemType>(
  itemType: T,
  fields: FieldModel<T>[],
  fullGraph: FullGraph,
): Record<string, ItemData> => {
  const scriptFields = fields.filter((field) => !!field.script);
  const ids = itemType === "nodes" ? fullGraph.nodes() : fullGraph.edges();
  const getAttributes = (id: string) =>
    itemType === "nodes" ? fullGraph.getNodeAttributes(id) : fullGraph.getEdgeAttributes(id);

  return fromPairs(
    ids.map((id, index) => {
      const attributes = getAttributes(id);
      const values: ItemData = {};
      scriptFields.forEach((field) => {
        try {
          values[field.id] = field.script!(id, attributes, index, fullGraph);
        } catch (_e) {
          values[field.id] = undefined;
        }
      });
      return [id, values];
    }),
  );
};

export const mergeStaticDynamicData = (
  staticData: Record<string, ItemData>,
  dynamicData: Record<string, ItemData>,
): Record<string, StaticDynamicItemData> => {
  return mapValues(staticData, (staticItemData, id) => ({
    static: staticItemData || {},
    dynamic: dynamicData[id] || {},
  }));
};

// A formula (scripted) field is computed on the fly and stored in the "dynamic" data channel, just
// like the topology-based dynamic attributes (degree, ...):
export const isComputedField = (field: Pick<FieldModel<ItemType, boolean>, "dynamic" | "script">) =>
  !!field.dynamic || !!field.script;

export const staticDynamicAttributeKey = (field: FieldModel<ItemType, boolean>) =>
  `${isComputedField(field) ? "dynamic" : "static"}.${field.id}`;

export const staticDynamicAttributeLabel = (field: FieldModel<ItemType, boolean>) => {
  if (field.dynamic) {
    return `${t(`graph.model.${field.id}`)} (${t("graph.model.dynamic")})`;
  }
  return field.label || field.id;
};

export function getScalarFromStaticDynamicData(
  data: StaticDynamicItemData,
  field: Pick<FieldModel<ItemType, boolean>, "id" | "dynamic" | "script">,
): Scalar {
  return isComputedField(field) ? data.dynamic[field.id] : data.static[field.id];
}
