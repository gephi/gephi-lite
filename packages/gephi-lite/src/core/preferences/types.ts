import { ItemType } from "../types";

/**
 * How the selection panel orders the items it lists. Persisted per item type: a node list usually
 * reads best alphabetically, while an edge list is often more useful ordered by weight, so the two
 * are remembered separately.
 */
export const SELECTION_SORT_MODES = ["alphabetical", "size"] as const;
export type SelectionSortMode = (typeof SELECTION_SORT_MODES)[number];

export interface Preferences {
  // for each layout, we save the parameters
  layoutsParameters: { [layout: string]: Record<string, unknown> };
  // for each metrics, we save the parameters
  metrics: {
    [metric: string]: {
      parameters: Record<string, unknown>;
      attributeNames: Record<string, string>;
    };
  };
  // current locale
  locale: string;
  // theme
  theme: "light" | "dark" | "auto";
  // sort order of the selection panel's list, for each item type
  selectionSort: Record<ItemType, SelectionSortMode>;
}
