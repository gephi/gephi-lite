import { Producer, asyncAction, atom, derivedAtom, producerToAction } from "@ouestware/atoms";
import { connectedCloseness } from "graphology-metrics/layout-quality";
import { debounce, identity, pick } from "lodash";
import seedRandom from "seedrandom";

import { EVENTS, emitter } from "../context/eventsContext";
import { graphDatasetActions, graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { dataGraphToFullGraph } from "../graph/utils";
import { resetCamera } from "../sigma";
import { LAYOUTS } from "./collection";
import { LayoutMapping, LayoutQuality, LayoutState } from "./types";

function getEmptyLayoutState(): LayoutState {
  return { quality: { enabled: false, showGrid: true }, type: "idle" };
}

function getLocalStorageLayoutState(): LayoutState {
  const raw = localStorage.getItem("layout");
  const state = raw ? JSON.parse(raw) : null;
  return {
    ...getEmptyLayoutState(),
    ...state,
  };
}

/**
 * Public API:
 * ***********
 */
export const layoutStateAtom = atom<LayoutState>(getLocalStorageLayoutState());

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
    layoutStateAtom.set((prev) => ({ ...prev, type: "running", layoutId: id }));

    // generate positions
    const fullGraph = dataGraphToFullGraph(dataset);
    const positions = layout.run(fullGraph, { settings: params });

    // Save it
    setNodePositions(positions);

    // To prevent resetting the camera before sigma receives new data, we
    // need to wait a frame, and also wait for it to trigger a refresh:
    setTimeout(() => {
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

const _computeLayoutQualityMetric: Producer<LayoutState> = () => {
  const sigmaGraph = sigmaGraphAtom.get();
  try {
    const metric = connectedCloseness(sigmaGraph, {
      rng: seedRandom("gephi-lite"),
    });
    return (state) => ({ ...state, quality: { ...state.quality, metric } });
  } catch (_e: unknown) {
    return identity;
  }
};

export const layoutActions = {
  startLayout,
  stopLayout,
  setQuality: producerToAction(setQuality, layoutStateAtom),
  computeLayoutQualityMetric: producerToAction(_computeLayoutQualityMetric, layoutStateAtom),
};

const gridEnabledAtom = derivedAtom(layoutStateAtom, (value) => pick(value.quality, "enabled"), {
  checkOutput: true,
});
gridEnabledAtom.bindEffect((connectedClosenessSettings) => {
  if (!connectedClosenessSettings.enabled) return;

  //Compute the layout quality metric when node's position changed
  const { computeLayoutQualityMetric } = layoutActions;
  const fn = debounce(computeLayoutQualityMetric, 300, { leading: true, maxWait: 300 });

  computeLayoutQualityMetric();
  const sigmaGraph = sigmaGraphAtom.get();
  // this event is triggered when a sync layout has been applied
  // this is a custom event
  emitter.on(EVENTS.graphImported, fn);

  // this event is triggered by user manually changing node positions by dragging node
  // this is a custom event
  emitter.on(EVENTS.nodesDragged, fn);

  // this event is triggered by async layout
  sigmaGraph.on("eachNodeAttributesUpdated", fn);

  return () => {
    emitter.off(EVENTS.graphImported, fn);
    emitter.off(EVENTS.nodesDragged, fn);
    sigmaGraph.off("eachNodeAttributesUpdated", fn);
  };
});
