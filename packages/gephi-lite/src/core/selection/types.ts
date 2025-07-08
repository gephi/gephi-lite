import { ItemType } from "../types";

export const GRAPH_SELECTION_MODES = ["cursor", "marquee", "lasso"] as const;
export type GraphSelectionMode = (typeof GRAPH_SELECTION_MODES)[number];
export const DEFAULT_GRAPH_SELECTION_MODE = GRAPH_SELECTION_MODES[0];

export interface SelectionState {
  type: ItemType;
  items: Set<string>;
  graphSelectionMode: GraphSelectionMode;
}
