import { graphDatasetActions, graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { dataGraphToFullGraph } from "../graph/utils";
import { resetCamera } from "../sigma";
import { atom } from "../utils/atoms";
import { asyncAction } from "../utils/producers";
import { LAYOUTS } from "./collection";
import { LayoutMapping, LayoutState } from "./types";

function getEmptyLayoutState(): LayoutState {
  return { type: "idle" };
}

/**
 * Public API:
 * ***********
 */
export const layoutStateAtom = atom<LayoutState>(getEmptyLayoutState());

/**
 * Actions:
 * ********
 */
export const startLayout = asyncAction(async (id: string, params: unknown) => {
  const { setNodePositions } = graphDatasetActions;
  const dataset = graphDatasetAtom.get();

  // search the layout
  const layout = LAYOUTS.find((l) => l.id === id);

  // Sync layout
  if (layout && layout.type === "sync") {
    layoutStateAtom.set({ type: "running", layoutId: id });

    // generate positions
    const fullGraph = dataGraphToFullGraph(dataset);
    const positions = layout.run(fullGraph, { settings: params });

    // Save it
    setNodePositions(positions);

    // To prevent resetting the camera before sigma receives new data, we
    // need to wait a frame, and also wait for it to trigger a refresh:
    setTimeout(() => {
      layoutStateAtom.set({ type: "idle" });
      resetCamera({ forceRefresh: false });
    }, 0);
  }

  // Sync layout
  if (layout && layout.type === "worker") {
    const worker = new layout.supervisor(sigmaGraphAtom.get(), { settings: params });
    worker.start();
    layoutStateAtom.set({ type: "running", layoutId: id, supervisor: worker });
  }
});

export const stopLayout = asyncAction(async () => {
  const { setNodePositions } = graphDatasetActions;
  const layoutState = layoutStateAtom.get();

  // when we stop the worker, we save the nodes position
  if (layoutState.type === "running" && layoutState.supervisor) {
    layoutState.supervisor.stop();
    layoutState.supervisor.kill();

    // Save data
    const positions: LayoutMapping = {};
    sigmaGraphAtom.get().forEachNode((node, { x, y }) => {
      positions[node] = { x, y };
    });
    setNodePositions(positions);
  }

  layoutStateAtom.set({ type: "idle" });
});

export const layoutActions = {
  startLayout,
  stopLayout,
};
