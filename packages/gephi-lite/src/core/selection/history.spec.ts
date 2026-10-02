import { beforeEach, describe, expect, it } from "vitest";

import { selectionActions, selectionAtom } from ".";
import {
  canGoToNextSelection,
  canGoToPreviousSelection,
  goToNextSelection,
  goToPreviousSelection,
  resetSelectionHistory,
} from "./history";
import { getEmptySelectionState } from "./utils";

const selected = () => ({ type: selectionAtom.get().type, items: Array.from(selectionAtom.get().items).sort() });
const selectNode = (node: string) => selectionActions.select({ type: "nodes", items: new Set([node]), replace: true });

describe("Selection history", () => {
  beforeEach(() => {
    selectionAtom.set(getEmptySelectionState());
    resetSelectionHistory();
  });

  describe("going back", () => {
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
      expect(canGoToPreviousSelection()).toBe(false);
      expect(goToPreviousSelection()).toBe(false);
    });

    it("should treat clearing the selection as a step of its own", () => {
      selectNode("a");
      selectNode("b");
      selectionActions.emptySelection();

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
      expect(canGoToPreviousSelection()).toBe(false);
    });

    it("should ignore a selection that does not actually change the selected items", () => {
      selectNode("a");
      selectNode("a");

      expect(goToPreviousSelection()).toBe(true);
      expect(selected()).toEqual({ type: "nodes", items: [] });
      expect(canGoToPreviousSelection()).toBe(false);
    });
  });

  describe("going forward again", () => {
    it("should walk forward through the selections left behind, up to the last visited one", () => {
      selectNode("a");
      selectNode("b");
      selectNode("c");
      goToPreviousSelection();
      goToPreviousSelection();
      expect(selected()).toEqual({ type: "nodes", items: ["a"] });

      expect(goToNextSelection()).toBe(true);
      expect(selected()).toEqual({ type: "nodes", items: ["b"] });
      expect(goToNextSelection()).toBe(true);
      expect(selected()).toEqual({ type: "nodes", items: ["c"] });
    });

    it("should stop at the last visited selection", () => {
      selectNode("a");
      goToPreviousSelection();

      expect(goToNextSelection()).toBe(true);
      expect(canGoToNextSelection()).toBe(false);
      expect(goToNextSelection()).toBe(false);
      expect(selected()).toEqual({ type: "nodes", items: ["a"] });
    });

    it("should have nothing to go forward to before going back", () => {
      selectNode("a");

      expect(canGoToNextSelection()).toBe(false);
      expect(goToNextSelection()).toBe(false);
    });

    it("should drop what was ahead when a new selection is made from a step back", () => {
      selectNode("a");
      selectNode("b");
      selectNode("c");
      goToPreviousSelection();
      goToPreviousSelection();
      expect(selected()).toEqual({ type: "nodes", items: ["a"] });

      // Picking a new item from there replaces the forward history, as in a browser:
      selectNode("d");
      expect(canGoToNextSelection()).toBe(false);
      expect(goToPreviousSelection()).toBe(true);
      expect(selected()).toEqual({ type: "nodes", items: ["a"] });
    });

    it("should not record the selections it restores itself", () => {
      selectNode("a");
      selectNode("b");
      goToPreviousSelection();
      goToNextSelection();

      // Back and forth must have left the history as it was: a, b and nothing beyond.
      expect(selected()).toEqual({ type: "nodes", items: ["b"] });
      expect(canGoToNextSelection()).toBe(false);
      expect(goToPreviousSelection()).toBe(true);
      expect(selected()).toEqual({ type: "nodes", items: ["a"] });
    });
  });
});
