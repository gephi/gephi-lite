import { beforeEach, describe, expect, it } from "vitest";

import { selectionActions, selectionAtom } from ".";
import { goToPreviousSelection, hasPreviousSelection, resetSelectionHistory } from "./history";
import { getEmptySelectionState } from "./utils";

const selected = () => ({ type: selectionAtom.get().type, items: Array.from(selectionAtom.get().items).sort() });
const selectNode = (node: string) => selectionActions.select({ type: "nodes", items: new Set([node]), replace: true });

describe("Selection history", () => {
  beforeEach(() => {
    selectionAtom.set(getEmptySelectionState());
    resetSelectionHistory();
  });

  it("should come back to the previously selected items, one step at a time", () => {
    selectNode("a");
    selectNode("b");
    selectNode("c");

    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: ["b"] });
    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: ["a"] });
  });

  it("should come back to the empty selection the first item was picked from, then stop", () => {
    selectNode("a");

    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: [] });
    expect(hasPreviousSelection()).toBe(false);
    expect(goToPreviousSelection()).toBe(false);
  });

  it("should treat clearing the selection as a step of its own", () => {
    selectNode("a");
    selectNode("b");
    selectionActions.emptySelection();
    expect(selected().items).toEqual([]);

    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: ["b"] });
  });

  it("should record selections of any kind, including multiple items and edges", () => {
    selectionActions.select({ type: "nodes", items: new Set(["a", "b"]), replace: true });
    selectionActions.select({ type: "edges", items: new Set(["e1"]), replace: true });

    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: ["a", "b"] });
  });

  it("should not record a change of selection mode", () => {
    selectNode("a");
    selectionActions.setMode("lasso");

    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: [] });
    expect(hasPreviousSelection()).toBe(false);
  });

  it("should not record the selections it restores itself", () => {
    selectNode("a");
    selectNode("b");

    goToPreviousSelection();
    expect(selected()).toEqual({ type: "nodes", items: ["a"] });
    // Only the step before "a" is left: restoring "a" must not have pushed "b" back on the stack.
    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: [] });
    expect(hasPreviousSelection()).toBe(false);
  });

  it("should ignore a selection that does not actually change the selected items", () => {
    selectNode("a");
    selectNode("a");

    expect(goToPreviousSelection()).toBe(true);
    expect(selected()).toEqual({ type: "nodes", items: [] });
    expect(hasPreviousSelection()).toBe(false);
  });
});
