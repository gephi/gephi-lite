import { DEFAULT_GRAPH_SELECTION_MODE, SelectionState } from "./types";

/**
 * Returns an empty selection state:
 */
export function getEmptySelectionState(): SelectionState {
  return {
    type: "nodes",
    items: new Set<string>(),
    graphSelectionMode: DEFAULT_GRAPH_SELECTION_MODE,
  };
}
