import { GephiLiteDriver } from "@gephi/gephi-lite-broadcast";
import Graph from "graphology";
import { afterEach, describe, expect, it } from "vitest";

// Import order matters here: this package has a pre-existing circular dependency between
// core/graph and core/context/dataContexts (unrelated to this file), and BroadcastClient
// happens to resolve it in the safe direction - importing it before core/graph avoids a
// "Cannot access before initialization" crash on sigmaGraphAtom.
import { BroadcastClient } from "./client";
import { graphDatasetAtom } from "../graph";
import { getEmptyGraphDataset, initializeGraphDataset } from "../graph/utils";
import { selectionActions, selectionAtom } from "../selection";

function buildGraph(nodes: string[]): Graph {
  const graph = new Graph();
  nodes.forEach((node) => graph.addNode(node));
  return graph;
}

describe("BroadcastClient - selection", () => {
  let client: BroadcastClient | undefined;
  let driver: GephiLiteDriver | undefined;

  afterEach(() => {
    client?.destroy();
    driver?.destroy();
    selectionActions.reset();
    graphDatasetAtom.set(getEmptyGraphDataset());
  });

  function setup(nodes: string[] = ["a", "b", "c"]) {
    const channelName = `test-selection-${Math.random().toString(36).slice(2)}`;
    client = new BroadcastClient(channelName);
    driver = new GephiLiteDriver(channelName);
    graphDatasetAtom.set(initializeGraphDataset(buildGraph(nodes)));
  }

  it("getSelection returns the current selection", async () => {
    setup();
    selectionActions.select({ type: "nodes", items: new Set(["a", "b"]) });

    const selection = await driver!.getSelection();

    expect(selection).toEqual({ nodeIds: ["a", "b"], edgeIds: [] });
  });

  it("setSelection updates the selection and emits selectionUpdate", async () => {
    setup();
    const updates: unknown[] = [];
    driver!.on("selectionUpdate", (data) => updates.push(data));

    await driver!.setSelection({ nodeIds: ["a", "c"], edgeIds: [] });

    expect(Array.from(selectionAtom.get().items).sort()).toEqual(["a", "c"]);
    expect(updates).toEqual([{ nodeIds: ["a", "c"], edgeIds: [] }]);
  });

  it("setGraphDataset keeps still-valid selected ids and drops stale ones", async () => {
    setup(["a", "b", "c"]);
    selectionActions.select({ type: "nodes", items: new Set(["a", "c"]) });

    // The replacement dataset intentionally has a different node COUNT (4, not 3) than the
    // first one. This isn't about the selection logic under test - it sidesteps a separate,
    // pre-existing bug in filteredGraphAtom (core/graph/index.ts): its derivedAtom() call
    // doesn't set `checkOutput: false`, and lodash.isEqual() treats any two different
    // graphology Graph instances of equal node/edge count as equal, so a same-size dataset
    // swap leaves it silently stale, which then makes the unrelated resetCamera() call inside
    // setGraphDataset throw. Reported separately; not fixed here.
    await driver!.setGraphDataset(initializeGraphDataset(buildGraph(["b", "c", "d", "e"])));

    expect(Array.from(selectionAtom.get().items)).toEqual(["c"]);
  });

  it("does not emit selectionUpdate when the effective selection does not change", async () => {
    setup();
    await driver!.setSelection({ nodeIds: ["a"], edgeIds: [] });

    const updates: unknown[] = [];
    driver!.on("selectionUpdate", (data) => updates.push(data));
    await driver!.setSelection({ nodeIds: ["a"], edgeIds: [] });

    expect(updates).toEqual([]);
  });
});
