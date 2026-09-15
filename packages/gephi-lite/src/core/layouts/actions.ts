import { Producer, asyncAction, producerToAction } from "@ouestware/atoms";
import { connectedCloseness } from "graphology-metrics/layout-quality";
import { identity } from "lodash";
import seedrandom from "seedrandom";

import { appearanceActions } from "../appearance/actions";
import { appearanceAtom } from "../appearance/atom";
import {
  dynamicItemDataAtom,
  filteredGraphAtom,
  graphDatasetActions,
  graphDatasetAtom,
  sigmaGraphAtom,
  visualGettersAtom,
} from "../graph";
import { dataGraphToFullGraph } from "../graph/utils";
import { sessionAtom } from "../session/atom";
import { resetCamera } from "../sigma";
import { layoutStateAtom } from "./atom";
import { LAYOUTS } from "./collection";
import { LayoutQuality, LayoutState } from "./types";
import { buildLayoutGraph, createLayoutSupervisor } from "./utils";

const stopLayout = asyncAction(async (isForRestart = false) => {
  const { setNodePositions } = graphDatasetActions;
  const layoutState = layoutStateAtom.get();

  if (layoutState.type === "computing") {
    layoutStateAtom.set({ ...layoutState, aborted: true });
  } else if (layoutState.type === "running") {
    layoutState.supervisor.stop();
    layoutState.supervisor.kill();

    // Don't save position if it's for a restart
    if (!isForRestart && layoutState.getPositions) {
      setNodePositions(layoutState.getPositions());
    }
  }

  // Don't set the state if it's for restart
  if (!isForRestart) layoutStateAtom.set((prev) => ({ ...prev, type: "idle" }));
});

export const startLayout = asyncAction(
  async (id: string, params: Record<string, unknown>, isForRestart: boolean = false) => {
    // Stop the previous algo (the "if needed" is done in the function itself)
    await stopLayout(isForRestart);

    const dataset = graphDatasetAtom.get();
    const { setNodePositions } = graphDatasetActions;

    // search the layout
    const layout = LAYOUTS.find((l) => l.id === id);

    if (layout) {
      // If the map is already displayed at the background, then we sync with it the scale variable
      if (layout.id === "geographic") {
        const appearance = appearanceAtom.get();
        if (appearance.backgroundLayer?.type === "map") {
          const { setBackgroundLayer } = appearanceActions;
          setBackgroundLayer({
            type: "map",
            map: {
              ...appearance.backgroundLayer.map,
              scale: params.scale as number,
            },
          });
        }
      }

      // Sync layout
      if (layout.type === "oneshot") {
        layoutStateAtom.set((prev) => ({ ...prev, type: "computing", layoutId: id }));

        // Generate positions
        const filteredGraph = filteredGraphAtom.get();
        const fullGraph = dataGraphToFullGraph(dataset, filteredGraph);
        const positionsOrPromise = layout.run(fullGraph, { settings: params });
        const positions = positionsOrPromise instanceof Promise ? await positionsOrPromise : positionsOrPromise;

        // Check if layout has changed or has been aborted
        const currentState = layoutStateAtom.get();
        if (currentState.type !== "computing" || currentState.layoutId !== id || currentState.aborted) return;

        // Save positions
        setNodePositions(positions);
        layoutStateAtom.set((prev) => ({ ...prev, type: "idle" }));

        // To prevent resetting the camera before sigma receives new data, we
        // need to wait a frame, and also wait for it to trigger a refresh:
        setTimeout(() => {
          resetCamera({ forceRefresh: true });
        }, 0);
      }

      // Async layout
      if (layout.type === "continuous") {
        const sigmaGraph = sigmaGraphAtom.get();
        const visualGetters = visualGettersAtom.get();
        const filteredGraph = filteredGraphAtom.get();
        const dynamicItemData = dynamicItemDataAtom.get();

        const layoutGraph = buildLayoutGraph({
          dataset,
          filteredGraph,
          visualGetters,
          dynamicItemData,
          sigmaGraph,
          params,
          useSigmaPositions: isForRestart,
        });
        const { supervisor, getPositions } = createLayoutSupervisor(
          layout.supervisor,
          layoutGraph,
          sigmaGraph,
          params,
          visualGetters.getNodePosition ?? undefined,
        );
        supervisor.start();
        layoutStateAtom.set((prev) => ({ ...prev, type: "running", layoutId: id, supervisor, getPositions }));
      }
    }
  },
);

const restartLastLayout = asyncAction(async () => {
  // Get the algo and its parameters
  const session = sessionAtom.get();
  if (session.lastLayout) {
    const layoutId = session.lastLayout;
    const layout = LAYOUTS.find((e) => e.id === layoutId);
    const params = session.layoutsParameters[layoutId] || {};
    if (layout) {
      await startLayout(layoutId, params, true);
    }
  }
});

export const setQuality: Producer<LayoutState, [LayoutQuality]> = (quality) => {
  return (state) => ({ ...state, quality });
};

const computeLayoutQualityMetric: Producer<LayoutState> = () => {
  const sigmaGraph = sigmaGraphAtom.get();
  try {
    const metric = connectedCloseness(sigmaGraph, {
      rng: seedrandom("gephi-lite"),
    });
    return (state) => ({ ...state, quality: { ...state.quality, metric } });
  } catch (_e: unknown) {
    return identity;
  }
};

export const layoutActions = {
  stopLayout,
  startLayout,
  restartLastLayout,
  setQuality: producerToAction(setQuality, layoutStateAtom),
  computeLayoutQualityMetric: producerToAction(computeLayoutQualityMetric, layoutStateAtom),
};
