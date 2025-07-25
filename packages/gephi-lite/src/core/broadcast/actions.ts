import { Producer, asyncAction, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { SerializedGraph } from "graphology-types";

import { appearanceAtom } from "../appearance";
import { AppearanceState } from "../appearance/types";
import { resetStates } from "../context/dataContexts";
import { fileAtom } from "../file";
import { graphDatasetActions } from "../graph";
import { initializeGraphDataset } from "../graph/utils";
import { resetCamera } from "../sigma";

/**
 * Actions:
 * ********
 */
// TODO: this code has a lot in commons with core/file/index.ts/open
// we should mutualize it
const importGraph = asyncAction(async (data: SerializedGraph, title?: string) => {
  if (fileAtom.get().status.type === "loading") throw new Error("A file is already being loaded");
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));
  try {
    const graph = Graph.from(data);
    if (title) graph.setAttribute("title", title);

    const { setGraphDataset } = graphDatasetActions;
    resetStates(false);
    setGraphDataset({ ...initializeGraphDataset(graph) });
    resetCamera({ forceRefresh: true });
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
    throw e;
  } finally {
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
  }
});

const updateAppearance: Producer<AppearanceState, [Partial<AppearanceState>]> = (newState) => {
  return (state) => ({ ...state, ...newState });
};

export const broadcastActions = {
  importGraph,
  updateAppearance: producerToAction(updateAppearance, appearanceAtom),
};
