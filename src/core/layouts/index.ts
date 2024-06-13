import { connectedCloseness } from "graphology-metrics/layout-quality";
import { debounce } from "lodash";

import { graphDatasetActions, graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { dataGraphToFullGraph } from "../graph/utils";
import { resetCamera } from "../sigma";
import { atom } from "../utils/atoms";
import { Producer, asyncAction, producerToAction } from "../utils/producers";
import { LAYOUTS } from "./collection";
import { LayoutMapping, LayoutQuality, LayoutState } from "./types";

function getEmptyLayoutState(): LayoutState {
  return { quality: { enabled: false, showGrid: true }, type: "idle" };
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
  const { quality } = layoutStateAtom.get();
  const { computeLayoutQualityMetric } = layoutActions;

  // search the layout
  const layout = LAYOUTS.find((l) => l.id === id);

  // Sync layout
  if (layout && layout.type === "sync") {
    layoutStateAtom.set((prev) => ({ ...prev, type: "running", layoutId: id }));

    // generate positions
    const fullGraph = dataGraphToFullGraph(dataset);
    const positions = layout.run(fullGraph, { settings: params });

    // Save it
    setNodePositions(positions);

    // To prevent resetting the camera before sigma receives new data, we
    // need to wait a frame, and also wait for it to trigger a refresh:
    setTimeout(() => {
      if (quality.enabled) computeLayoutQualityMetric();
      layoutStateAtom.set((prev) => ({ ...prev, type: "idle" }));
      resetCamera({ forceRefresh: false });
    }, 0);
  }

  // Sync layout
  if (layout && layout.type === "worker") {
    const worker = new layout.supervisor(sigmaGraphAtom.get(), { settings: params });
    worker.start();
    layoutStateAtom.set((prev) => ({ ...prev, type: "running", layoutId: id, supervisor: worker }));
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

  layoutStateAtom.set((prev) => ({ ...prev, type: "idle" }));
});

export const setQuality: Producer<LayoutState, [LayoutQuality]> = (quality) => {
  return (state) => ({ ...state, quality });
};

export const computeLayoutQualityMetric: Producer<LayoutState, []> = () => {
  const sigmaGraph = sigmaGraphAtom.get();
  const metric = connectedCloseness(sigmaGraph);

  return (state) => ({ ...state, quality: { ...state.quality, metric } });
};

export const layoutActions = {
  startLayout,
  stopLayout,
  setQuality: producerToAction(setQuality, layoutStateAtom),
  computeLayoutQualityMetric: producerToAction(computeLayoutQualityMetric, layoutStateAtom),
};

layoutStateAtom.bind((layoutState, prevState) => {
  const updatedQualityKeys = new Set(
    (Object.keys(layoutState.quality) as (keyof LayoutState["quality"])[]).filter(
      (key) => layoutState.quality[key] !== prevState.quality[key],
    ),
  );

  const { computeLayoutQualityMetric } = layoutActions;

  if (updatedQualityKeys.has("enabled")) {
    const fn = debounce(computeLayoutQualityMetric, 500, { leading: true, maxWait: 500 });
    if (layoutState.quality.enabled) {
      computeLayoutQualityMetric();
      sigmaGraphAtom.get().on("nodeAttributesUpdated", fn);
      sigmaGraphAtom.get().on("eachNodeAttributesUpdated", fn);
    } else {
      sigmaGraphAtom.get().off("eachNodeAttributesUpdated", fn);
      sigmaGraphAtom.get().off("nodeAttributesUpdated", fn);
    }
  }
});
