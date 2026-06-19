import { type AppearanceState, type FieldModel, getEmptyAppearanceState } from "@gephi/gephi-lite-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { syncAppearanceStateWithGraphFields } from "./appearanceSync";
import { getEmptyGraphDataset } from "./utils";

const categoryField: FieldModel<"nodes"> = {
  id: "group",
  itemType: "nodes",
  type: "category",
};

describe("syncAppearanceStateWithGraphFields", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "Option",
      class {
        style = { color: "" };
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resets appearance elements bound to missing static fields", () => {
    const graphDataset = getEmptyGraphDataset();
    graphDataset.nodeFields = [{ ...categoryField, id: "existing" }];

    const appearanceState: AppearanceState = {
      ...getEmptyAppearanceState(),
      backgroundColor: "#123456",
      nodesColor: {
        type: "partition",
        field: categoryField,
        colorPalette: { A: "#111111" },
        missingColor: "#000000",
      },
    };

    const syncedState = syncAppearanceStateWithGraphFields(graphDataset, appearanceState);

    expect(syncedState.backgroundColor).toBe("#123456");
    expect(syncedState.nodesColor).toEqual(getEmptyAppearanceState().nodesColor);
  });

  it("refreshes incomplete partition palettes without mutating the input state", () => {
    const graphDataset = getEmptyGraphDataset();
    graphDataset.nodeFields = [categoryField];
    graphDataset.nodeData = {
      n1: { group: "A" },
      n2: { group: "B" },
    };

    const originalPalette = { A: "#111111" };
    const appearanceState: AppearanceState = {
      ...getEmptyAppearanceState(),
      nodesColor: {
        type: "partition",
        field: categoryField,
        colorPalette: originalPalette,
        missingColor: "#000000",
      },
    };

    const syncedState = syncAppearanceStateWithGraphFields(graphDataset, appearanceState);

    expect(appearanceState.nodesColor).toMatchObject({ colorPalette: originalPalette });
    expect(syncedState.nodesColor.type).toBe("partition");
    if (syncedState.nodesColor.type === "partition") {
      expect(Object.keys(syncedState.nodesColor.colorPalette)).toEqual(["A", "B"]);
      expect(syncedState.nodesColor.colorPalette).not.toBe(originalPalette);
    }
  });
});
