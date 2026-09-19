import { FieldModel, GraphDataset, ItemData, ItemType } from "@gephi/gephi-lite-sdk";
import { mapValues } from "lodash";
import { DateTime } from "luxon";

/**
 * Automatic "creation date" / "update date" fields, set on every node and
 * edge, and kept in sync whenever their data is created or updated.
 */

export const SYSTEM_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

export const CREATION_DATE_FIELD_ID = "creation_date";
export const UPDATE_DATE_FIELD_ID = "update_date";

export function nowAsSystemDateScalar(): string {
  return DateTime.now().toFormat(SYSTEM_DATE_FORMAT);
}

// Order matters: this is also the order in which the fields end up in the data table (always last).
export function getSystemDateFieldModels<T extends ItemType>(itemType: T): FieldModel<T>[] {
  return [
    {
      id: UPDATE_DATE_FIELD_ID,
      itemType,
      type: "date",
      format: SYSTEM_DATE_FORMAT,
      label: "Update Date",
      readOnly: true,
    },
    {
      id: CREATION_DATE_FIELD_ID,
      itemType,
      type: "date",
      format: SYSTEM_DATE_FORMAT,
      label: "Creation Date",
      readOnly: true,
    },
  ];
}

// Appends the system date fields at the end of the given fields list, unless they are already there:
export function ensureSystemDateFields<T extends ItemType>(itemType: T, fields: FieldModel<T>[]): FieldModel<T>[] {
  const missing = getSystemDateFieldModels(itemType).filter(
    (systemField) => !fields.some((f) => f.id === systemField.id),
  );
  return missing.length ? [...fields, ...missing] : fields;
}

// Stamps creation and update date on brand-new item data:
export function stampCreationDates(data: ItemData): ItemData {
  const now = nowAsSystemDateScalar();
  return { ...data, [CREATION_DATE_FIELD_ID]: now, [UPDATE_DATE_FIELD_ID]: now };
}

// Stamps update date on existing item data, preserving its original creation date:
export function stampUpdateDate(previousData: ItemData | undefined, data: ItemData): ItemData {
  return {
    ...data,
    [CREATION_DATE_FIELD_ID]: previousData?.[CREATION_DATE_FIELD_ID],
    [UPDATE_DATE_FIELD_ID]: nowAsSystemDateScalar(),
  };
}

// Finds the item (node or edge) whose update date is the most recent, among the given item data.
// Update dates are stored in the fixed SYSTEM_DATE_FORMAT ("yyyy-MM-dd HH:mm:ss"), which sorts
// lexicographically, so a plain string comparison is enough to order them. Returns null when no
// item carries an update date (eg. an empty graph).
export function getMostRecentlyUpdatedItem(itemData: Record<string, ItemData>): { id: string; date: string } | null {
  let mostRecent: { id: string; date: string } | null = null;
  for (const [id, data] of Object.entries(itemData)) {
    const date = data[UPDATE_DATE_FIELD_ID];
    if (typeof date === "string" && (mostRecent === null || date > mostRecent.date)) {
      mostRecent = { id, date };
    }
  }
  return mostRecent;
}

// Backfills the system date fields (and field models) on a dataset that predates this feature, eg. one
// restored from local storage or an older saved project. Items that already have both dates are left untouched:
export function ensureSystemDatesInDataset(dataset: GraphDataset): GraphDataset {
  const stampIfMissing = (data: ItemData) =>
    data[CREATION_DATE_FIELD_ID] && data[UPDATE_DATE_FIELD_ID] ? data : stampCreationDates(data);

  return {
    ...dataset,
    nodeFields: ensureSystemDateFields("nodes", dataset.nodeFields),
    edgeFields: ensureSystemDateFields("edges", dataset.edgeFields),
    nodeData: mapValues(dataset.nodeData, stampIfMissing),
    edgeData: mapValues(dataset.edgeData, stampIfMissing),
  };
}
