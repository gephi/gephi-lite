import { SerializedSelectionState } from "@gephi/gephi-lite-broadcast";
import { DatalessGraph } from "@gephi/gephi-lite-sdk";

import { DEFAULT_GRAPH_SELECTION_MODE, GraphSelectionMode, SelectionState } from "./types";

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

/**
 * Broadcast API helpers:
 * **********************
 * Gephi Lite's internal selection model only ever has one active item type
 * (nodes XOR edges) - these helpers translate to/from the broadcast-facing
 * SerializedSelectionState shape ({ nodeIds, edgeIds }), which does not leak
 * that implementation detail to external callers.
 */

/**
 * Converts the internal selection state to its broadcast-facing shape.
 */
export function serializeSelection(selection: SelectionState): SerializedSelectionState {
  const ids = Array.from(selection.items);
  return {
    nodeIds: selection.type === "nodes" ? ids : [],
    edgeIds: selection.type === "edges" ? ids : [],
  };
}

/**
 * Converts a broadcast-facing selection back to the internal shape. Gephi Lite cannot
 * represent a simultaneous nodes+edges selection today, so if both nodeIds and edgeIds
 * are provided, nodeIds take precedence (documented limitation, not silently resolved).
 * `graphSelectionMode` is a UI-only concept unrelated to *what* is selected, so the
 * caller's current mode is preserved rather than reset.
 */
export function deserializeSelection(
  serialized: SerializedSelectionState,
  graphSelectionMode: GraphSelectionMode,
): SelectionState {
  if (serialized.nodeIds.length > 0) {
    return { type: "nodes", items: new Set(serialized.nodeIds), graphSelectionMode };
  }
  if (serialized.edgeIds.length > 0) {
    return { type: "edges", items: new Set(serialized.edgeIds), graphSelectionMode };
  }
  return { type: "nodes", items: new Set<string>(), graphSelectionMode };
}

/**
 * Order-independent equality check on the broadcast-facing shape - used to decide whether
 * a selectionUpdate event is actually needed, since atoms only compare by reference (see
 * @ouestware/atoms), not by value.
 */
export function selectionStatesAreEqual(
  a: SerializedSelectionState,
  b: SerializedSelectionState | null,
): boolean {
  if (!b) return false;
  const sameIds = (x: string[], y: string[]) => x.length === y.length && new Set(x).size === new Set(y).size && x.every((id) => y.includes(id));
  return sameIds(a.nodeIds, b.nodeIds) && sameIds(a.edgeIds, b.edgeIds);
}

/**
 * Drops any selected id that no longer exists in the given graph. Used (1) after a
 * dataset replacement via the broadcast API, so a stale selection never lingers, and (2)
 * when an external caller sets a selection directly, so unknown ids never pollute the
 * internal state.
 */
export function pruneSelectionToGraph(selection: SelectionState, graph: DatalessGraph): SelectionState {
  if (selection.items.size === 0) return selection;

  const exists = selection.type === "nodes" ? (id: string) => graph.hasNode(id) : (id: string) => graph.hasEdge(id);
  const validItems = new Set(Array.from(selection.items).filter(exists));
  if (validItems.size === selection.items.size) return selection;

  return { ...selection, items: validItems };
}
