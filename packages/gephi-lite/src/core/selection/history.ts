import { selectionActions, selectionAtom } from ".";
import { SelectionState } from "./types";

/**
 * Navigation history of the selection, so the back button walks back through the nodes and edges
 * visited in this tab - like following hyperlinks in a browser - instead of leaving the app right
 * away (see the back-button guard in core/Initialize).
 *
 * It is fed by a binding on `selectionAtom` rather than by the click handlers: every way of
 * changing the selection goes through that atom (graph click, search result, data table, "select
 * neighbors", shortest path, lasso...), so they are all recorded by one and the same code, and no
 * new entry point can forget to.
 *
 * Kept in memory only: it describes a browsing session, not the workspace, and starts empty again
 * on a reload like a freshly opened browser tab.
 */

// One visited selection. The empty selection counts as one: clearing the selection is a step the
// back button undoes, rather than something that silently drops the item from the history.
type VisitedSelection = Pick<SelectionState, "type" | "items">;

// Beyond this, the oldest entries are forgotten: a long session should not grow without end, and
// nobody walks back through hundreds of steps.
const MAX_ENTRIES = 100;

const previousSelections: VisitedSelection[] = [];

// True while `goToPreviousSelection` applies an entry: the resulting atom change is a replay of
// something already in the history, not a new step to record.
let isRestoring = false;

function hasSameItems(a: VisitedSelection, b: VisitedSelection): boolean {
  // The item type only matters when something is selected: "no node selected" and "no edge
  // selected" are the same (empty) state as far as navigating back is concerned.
  if (a.items.size !== b.items.size) return false;
  if (!a.items.size) return true;
  return a.type === b.type && Array.from(a.items).every((item) => b.items.has(item));
}

function snapshot({ type, items }: SelectionState): VisitedSelection {
  return { type, items: new Set(items) };
}

/** Whether the back button still has a selection to come back to. */
export function hasPreviousSelection(): boolean {
  return previousSelections.length > 0;
}

/**
 * Goes back to the previously visited selection, if any. Returns false when the history is empty,
 * leaving the caller to decide what the back button does then.
 */
export function goToPreviousSelection(): boolean {
  const previous = previousSelections.pop();
  if (!previous) return false;

  isRestoring = true;
  try {
    // Restoring goes through the regular selection action, so everything that reacts to a
    // selection - the panel, the data table, the camera framing on it - behaves exactly as if the
    // item had just been picked again.
    selectionActions.select({ type: previous.type, items: previous.items, replace: true });
  } finally {
    isRestoring = false;
  }
  return true;
}

/** Forgets the visited selections, e.g. when the whole workspace is replaced. */
export function resetSelectionHistory(): void {
  previousSelections.length = 0;
}

selectionAtom.bind((state, previousState) => {
  const visited = snapshot(state);
  const left = snapshot(previousState);
  // Ignore anything that is not a change of selection, starting with the selection mode
  // (cursor/marquee/lasso), which lives in the same atom.
  if (hasSameItems(visited, left)) return;
  if (isRestoring) return;

  previousSelections.push(left);
  if (previousSelections.length > MAX_ENTRIES) previousSelections.shift();
});
