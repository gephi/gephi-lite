import { atom } from "@ouestware/atoms";

import { selectionActions, selectionAtom } from ".";
import { ItemType } from "../types";
import { SelectionState } from "./types";

/**
 * Navigation history of the selection, so the back and forward buttons walk through the nodes and
 * edges visited in this tab - like following hyperlinks in a browser - instead of leaving the app
 * right away (see the back-button guard in core/Initialize, which maps each entry below to a
 * browser history entry).
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
export interface VisitedSelection {
  // Identifies the entry for the whole of its life, including once older entries have been
  // dropped: browser history entries refer to it, and positions would shift under them.
  id: number;
  type: ItemType;
  items: Set<string>;
}

export interface SelectionHistoryState {
  visited: VisitedSelection[];
  // Position of the selection currently displayed, in `visited`.
  cursor: number;
}

// Beyond this, the oldest entries are forgotten: a long session should not grow without end, and
// nobody walks back through hundreds of steps.
const MAX_ENTRIES = 200;

// Key under which a browser history entry carries the id of the selection it stands for (see the
// back-button guard in core/Initialize).
export const SELECTION_ENTRY_KEY = "gephiLiteSelectionEntry";

let nextId = 0;

function newEntry({ type, items }: Pick<SelectionState, "type" | "items">): VisitedSelection {
  return { id: nextId++, type, items: new Set(items) };
}

export const selectionHistoryAtom = atom<SelectionHistoryState>({
  visited: [newEntry(selectionAtom.get())],
  cursor: 0,
});

// True while this module applies an entry: the resulting atom change is a replay of something
// already in the history, not a new step to record.
let isRestoring = false;

function hasSameItems(a: Pick<SelectionState, "type" | "items">, b: Pick<SelectionState, "type" | "items">): boolean {
  // The item type only matters when something is selected: "no node selected" and "no edge
  // selected" are the same (empty) state as far as navigating back is concerned.
  if (a.items.size !== b.items.size) return false;
  if (!a.items.size) return true;
  return a.type === b.type && Array.from(a.items).every((item) => b.items.has(item));
}

/** The entry currently displayed, the one browser history entries are pushed for. */
export function getCurrentEntry(): VisitedSelection | undefined {
  const { visited, cursor } = selectionHistoryAtom.get();
  return visited[cursor];
}

export function canGoToPreviousSelection(): boolean {
  return selectionHistoryAtom.get().cursor > 0;
}

export function canGoToNextSelection(): boolean {
  const { visited, cursor } = selectionHistoryAtom.get();
  return cursor < visited.length - 1;
}

/**
 * Displays the visited selection with the given id, wherever it sits relative to the current one:
 * the browser is free to jump several entries at once (a long press on its back button), and only
 * it knows where the user asked to land.
 *
 * Returns false when that entry is unknown, which means the user navigated out of what is
 * remembered - out of the application, as far as the caller is concerned.
 */
export function goToSelectionEntry(id: number): boolean {
  const { visited } = selectionHistoryAtom.get();
  const index = visited.findIndex((entry) => entry.id === id);
  if (index < 0) return false;

  const entry = visited[index];
  selectionHistoryAtom.set((state) => ({ ...state, cursor: index }));

  // Already displayed (a navigation we undid ourselves, or a duplicate entry): leave the selection
  // - and the camera framing that follows it - alone.
  if (hasSameItems(entry, selectionAtom.get())) return true;

  isRestoring = true;
  try {
    // Restoring goes through the regular selection action, so everything that reacts to a
    // selection - the panel, the data table, the camera framing on it - behaves exactly as if the
    // item had just been picked again.
    selectionActions.select({ type: entry.type, items: entry.items, replace: true });
  } finally {
    isRestoring = false;
  }
  return true;
}

function goToStep(step: -1 | 1): boolean {
  const { visited, cursor } = selectionHistoryAtom.get();
  const target = visited[cursor + step];
  return target ? goToSelectionEntry(target.id) : false;
}

/** Goes back to the previously visited selection. False when there is none left. */
export function goToPreviousSelection(): boolean {
  return goToStep(-1);
}

/** Goes forward again to the selection left behind by a previous back. False when there is none. */
export function goToNextSelection(): boolean {
  return goToStep(1);
}

/**
 * Forgets the visited selections, e.g. when the whole workspace is replaced.
 *
 * The entry being displayed keeps its identity: a browser history entry already stands for it, and
 * minting a new one would leave that entry behind with nothing to restore - a step that answers
 * neither back nor forward.
 */
export function resetSelectionHistory(): void {
  selectionHistoryAtom.set(({ visited, cursor }) => {
    const current = visited[cursor];
    const { type, items } = selectionAtom.get();
    return {
      visited: [current ? { ...current, type, items: new Set(items) } : newEntry(selectionAtom.get())],
      cursor: 0,
    };
  });
}

selectionAtom.bind((state) => {
  // Ignore anything that is not a change of selection, starting with the selection mode
  // (cursor/marquee/lasso), which lives in the same atom.
  const current = getCurrentEntry();
  if (current && hasSameItems(current, state)) return;
  if (isRestoring) return;

  selectionHistoryAtom.set(({ visited, cursor }) => {
    // Selecting something new from a step back drops what was ahead, exactly as opening a link
    // from a page you came back to drops the browser's forward history.
    const kept = visited.slice(Math.max(0, cursor + 1 - MAX_ENTRIES), cursor + 1);
    const next = [...kept, newEntry(state)];
    return { visited: next, cursor: next.length - 1 };
  });
});
