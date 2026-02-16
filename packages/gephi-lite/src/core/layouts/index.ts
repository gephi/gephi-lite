import { CoordinateGetter } from "@gephi/gephi-lite-sdk";
import { Producer, asyncAction, atom, derivedAtom, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { connectedCloseness } from "graphology-metrics/layout-quality";
import { debounce, identity, pick } from "lodash";
import seedRandom from "seedrandom";

import { localStorage } from "../../utils/storage";
import { EVENTS, emitter } from "../context/eventsContext";
import { graphDatasetActions, graphDatasetAtom, sigmaGraphAtom, visualGettersAtom } from "../graph";
import { dataGraphToFullGraph } from "../graph/utils";
import { sessionAtom } from "../session";
import { resetCamera } from "../sigma";
import { LAYOUTS } from "./collection";
import {
  LayoutMapping,
  LayoutQuality,
  LayoutState,
  WorkerSupervisorConstructor,
  WorkerSupervisorInterface,
} from "./types";

/**
 * Creates a layout supervisor that runs on a cloned graph. In map mode,
 * positions are projected between graph space and Mercator space; otherwise
 * positions are copied as-is.
 */
function createLayoutSupervisor(
  SupervisorClass: WorkerSupervisorConstructor,
  sigmaGraph: Graph,
  options: unknown,
  transforms?: {
    getNodePosition?: CoordinateGetter;
    reverseNodePosition?: CoordinateGetter;
  },
): { supervisor: WorkerSupervisorInterface; getPositions: () => LayoutMapping } {
  const passthrough: CoordinateGetter = (pos) => pos;
  const toGraph = transforms?.reverseNodePosition ?? passthrough;
  const toSigma = transforms?.getNodePosition ?? passthrough;

  const shadowGraph = sigmaGraph.copy();
  shadowGraph.forEachNode((node, { x, y }) => {
    const pos = toGraph({ x, y });
    shadowGraph.setNodeAttribute(node, "x", pos.x);
    shadowGraph.setNodeAttribute(node, "y", pos.y);
  });

  const syncToSigma = () => {
    if (transforms?.getNodePosition) {
      let minY = Infinity,
        maxY = -Infinity;
      shadowGraph.forEachNode((_, { y }) => {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    }

    shadowGraph.forEachNode((node, { x, y }) => {
      const pos = toSigma({ x, y });
      sigmaGraph.setNodeAttribute(node, "x", pos.x);
      sigmaGraph.setNodeAttribute(node, "y", pos.y);
    });
  };
  shadowGraph.on("eachNodeAttributesUpdated", syncToSigma);

  const inner = new SupervisorClass(shadowGraph, { settings: options });

  return {
    supervisor: {
      start: () => inner.start(),
      stop: () => inner.stop(),
      kill: () => {
        inner.kill();
        shadowGraph.off("eachNodeAttributesUpdated", syncToSigma);
      },
      isRunning: () => inner.isRunning(),
    },
    getPositions: () => {
      const positions: LayoutMapping = {};
      shadowGraph.forEachNode((node, { x, y }) => {
        positions[node] = { x, y };
      });
      return positions;
    },
  };
}

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
export const stopLayout = asyncAction(async (isForRestart = false) => {
  const { setNodePositions } = graphDatasetActions;
  const layoutState = layoutStateAtom.get();

  if (layoutState.type === "running" && layoutState.supervisor) {
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

export const startLayout = asyncAction(async (id: string, params: Record<string, unknown>, isForRestart = false) => {
  // Stop the previous algo (the "if needed" is done in the function itself)
  await stopLayout(isForRestart);

  const dataset = graphDatasetAtom.get();
  const { setNodePositions } = graphDatasetActions;

  // search the layout
  const layout = LAYOUTS.find((l) => l.id === id);

  if (layout) {
    // Sync layout
    if (layout.type === "sync") {
      layoutStateAtom.set((prev) => ({ ...prev, type: "running", layoutId: id, supervisor: undefined }));

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

    // Async layout
    if (layout.type === "worker") {
      const sigmaGraph = sigmaGraphAtom.get();
      const visualGetters = visualGettersAtom.get();

      // Fixed node management
      // ---------------------
      // If layout parameter has a `getNodeFixedAttribut`, then we have to set the 'fixed' attribut in sigma's graph
      // On a layout restart, if parameter has been removed, we need to set to false
      // We also use the 'fixed' attribut for drag'n'drop
      sigmaGraph.updateEachNodeAttributes((id, attrs) => {
        let fixed = attrs.dragging === true;
        if ("getNodeFixedAttribut" in params && params.getNodeFixedAttribut) {
          const fixedAttribut = `${params.getNodeFixedAttribut}`;
          if (dataset.nodeData[id][fixedAttribut] === true) {
            fixed = true;
          }
        }
        return { ...attrs, fixed };
      });

      const { supervisor, getPositions } = createLayoutSupervisor(layout.supervisor, sigmaGraph, params, {
        getNodePosition: visualGetters.getNodePosition ?? undefined,
        reverseNodePosition: visualGetters.reverseNodePosition ?? undefined,
      });
      supervisor.start();
      layoutStateAtom.set((prev) => ({ ...prev, type: "running", layoutId: id, supervisor, getPositions }));
    }
  }
});

export const restartLastLayout = asyncAction(async () => {
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
  stopLayout,
  startLayout,
  restartLastLayout,
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

layoutStateAtom.bindEffect((state) => {
  if (state.type !== "running") return;

  const fnHandleDraggin = debounce(restartLastLayout, 100, { leading: true, trailing: true, maxWait: 100 });
  emitter.on(EVENTS.nodesDragged, fnHandleDraggin);
  return () => {
    emitter.off(EVENTS.nodesDragged, fnHandleDraggin);
  };
});
