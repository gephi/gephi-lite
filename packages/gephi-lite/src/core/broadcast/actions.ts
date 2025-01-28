import { Producer, asyncAction, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { SerializedGraph } from "graphology-types";

import { appearanceAtom } from "../appearance";
import { AppearanceState } from "../appearance/types";
import { resetStates } from "../context/dataContexts";
import { graphDatasetActions } from "../graph";
import { importStateAtom } from "../graph/import";
import { initializeGraphDataset } from "../graph/utils";
import { resetCamera } from "../sigma";

/**
 * Actions:
 * ********
 */
const importGraph = asyncAction(async (data: SerializedGraph, title?: string) => {
  if (importStateAtom.get().type === "loading") throw new Error("A file is already being loaded");
  importStateAtom.set({ type: "loading" });
  try {
    const graph = Graph.from(data);
    if (title) graph.setAttribute("title", title);

    const { setGraphDataset } = graphDatasetActions;
    resetStates(false);
    setGraphDataset({ ...initializeGraphDataset(graph) });
    resetCamera({ forceRefresh: true });
  } catch (e) {
    importStateAtom.set({ type: "error", message: (e as Error).message });
    throw e;
  } finally {
    importStateAtom.set({ type: "idle" });
  }
});

const updateAppearance: Producer<AppearanceState, [Partial<AppearanceState>]> = (newState) => {
  return (state) => ({ ...state, ...newState });
};

export const broadcastActions = {
  importGraph,
  updateAppearance: producerToAction(updateAppearance, appearanceAtom),
};
