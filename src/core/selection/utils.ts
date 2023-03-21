import { SelectionState } from "./types";

/**
 * Returns an empty selection state:
 */
export function getEmptySelectionState(): SelectionState {
  return {
    type: "nodes",
    items: new Set<string>(),
  };
}
