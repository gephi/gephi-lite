import {
  APPEARANCE_ITEM_TYPES,
  type AppearanceState,
  type FieldModel,
  getEmptyAppearanceState,
} from "@gephi/gephi-lite-sdk";
import { isString, omitBy } from "lodash";

import { getPalette } from "../../components/GraphAppearance/color/utils";
import { type GraphDataset } from "./types";
import { uniqFieldValuesAsStrings } from "./utils";

type AppearanceElement = AppearanceState[keyof AppearanceState];
type StaticFieldAppearanceElement = Exclude<AppearanceElement, string | undefined> & {
  field: FieldModel;
};

function hasStaticField(appearanceElement: AppearanceElement): appearanceElement is StaticFieldAppearanceElement {
  return (
    !!appearanceElement &&
    !isString(appearanceElement) &&
    "field" in appearanceElement &&
    !!appearanceElement.field &&
    !appearanceElement.field.dynamic
  );
}

function shouldDropAppearanceElement(
  appearanceElement: AppearanceElement,
  key: keyof AppearanceState,
  nodeFieldIds: Set<string>,
  edgeFieldIds: Set<string>,
): boolean {
  if (!hasStaticField(appearanceElement)) return false;

  const itemType = APPEARANCE_ITEM_TYPES[key];

  return (
    (itemType === "edges" && !edgeFieldIds.has(appearanceElement.field.id)) ||
    (itemType === "nodes" && !nodeFieldIds.has(appearanceElement.field.id))
  );
}

function syncPartitionPalette(
  graphDataset: GraphDataset,
  key: keyof AppearanceState,
  appearanceElement: AppearanceElement,
): AppearanceElement {
  if (!appearanceElement || isString(appearanceElement) || !("type" in appearanceElement)) return appearanceElement;
  if (appearanceElement.type !== "partition") return appearanceElement;

  const itemType = APPEARANCE_ITEM_TYPES[key];
  if (!itemType) return appearanceElement;

  const itemsData = graphDataset[itemType === "nodes" ? "nodeData" : "edgeData"];
  const values = uniqFieldValuesAsStrings(itemsData, appearanceElement.field.id);
  const paletteNeedsSync =
    Object.keys(appearanceElement.colorPalette).length < values.length ||
    values.some((value) => appearanceElement.colorPalette[value] === undefined);

  if (!paletteNeedsSync) return appearanceElement;

  return {
    ...appearanceElement,
    colorPalette: getPalette(values),
  };
}

export function syncAppearanceStateWithGraphFields(
  graphDataset: GraphDataset,
  appearanceState: AppearanceState,
): AppearanceState {
  const nodeFieldIds = new Set(graphDataset.nodeFields.map((field) => field.id));
  const edgeFieldIds = new Set(graphDataset.edgeFields.map((field) => field.id));

  const stateWithExistingFields = {
    ...getEmptyAppearanceState(),
    ...omitBy(appearanceState, (appearanceElement, key: keyof AppearanceState) =>
      shouldDropAppearanceElement(appearanceElement, key, nodeFieldIds, edgeFieldIds),
    ),
  } as AppearanceState;

  return Object.fromEntries(
    Object.entries(stateWithExistingFields).map(([key, appearanceElement]) => [
      key,
      syncPartitionPalette(graphDataset, key as keyof AppearanceState, appearanceElement),
    ]),
  ) as unknown as AppearanceState;
}
