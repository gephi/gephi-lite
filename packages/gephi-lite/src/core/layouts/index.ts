import { CoordinateGetter, DEFAULT_EDGE_SIZE, DEFAULT_NODE_SIZE, StaticDynamicItemData } from "@gephi/gephi-lite-sdk";
import { Producer, asyncAction, atom, derivedAtom, producerToAction } from "@ouestware/atoms";
import Graph, { MultiGraph } from "graphology";
import { connectedCloseness } from "graphology-metrics/layout-quality";
import { debounce, identity, pick } from "lodash";
import seedRandom from "seedrandom";

import { localStorage } from "../../utils/storage";
import { VisualGetters } from "../appearance/types";
import { EVENTS, emitter } from "../context/eventsContext";
import {
  dynamicItemDataAtom,
  filteredGraphAtom,
  graphDatasetActions,
  graphDatasetAtom,
  sigmaGraphAtom,
  visualGettersAtom,
} from "../graph";
import { DatalessGraph, DynamicItemData, GraphDataset, SigmaGraph } from "../graph/types";
import { dataGraphToFullGraph } from "../graph/utils";
import { sessionAtom } from "../session";
import { resetCamera } from "../sigma";
import { LAYOUTS } from "./collection";
import {
  LayoutMapping,
  LayoutQuality,
  LayoutState,
  ContinuousLayoutSupervisorConstructor,
  ContinuousLayoutSupervisorInterface,
} from "./types";

/**
 * Builds a lightweight layout graph from dataset sources with only what layouts
 * need: x, y, size, fixed for nodes; weight for edges.
 */
export function buildLayoutGraph({
  dataset,
  filteredGraph,
  visualGetters,
  dynamicItemData,
  sigmaGraph,
  params,
  useSigmaPositions,
}: {
  dataset: GraphDataset;
  filteredGraph: DatalessGraph;
  visualGetters: VisualGetters;
  dynamicItemData: DynamicItemData;
  sigmaGraph: SigmaGraph;
  params: Record<string, unknown>;
  useSigmaPositions: boolean;
}): SigmaGraph {
  const layoutGraph = sigmaGraph.nullCopy();
  const reversePos = visualGetters.reverseNodePosition;
  const fixedAttr =
    "getNodeFixedAttribut" in params && params.getNodeFixedAttribut ? `${params.getNodeFixedAttribut}` : null;

  filteredGraph.forEachNode((node) => {
    let x: number, y: number;
    if (useSigmaPositions) {
      const sx = sigmaGraph.getNodeAttribute(node, "x");
      const sy = sigmaGraph.getNodeAttribute(node, "y");
      if (reversePos) {
        const p = reversePos({ x: sx, y: sy });
        x = p.x;
        y = p.y;
      } else {
        x = sx;
        y = sy;
      }
    } else {
      const pos = dataset.layout[node];
      x = pos?.x ?? 0;
      y = pos?.y ?? 0;
    }

    const data: StaticDynamicItemData = {
      static: dataset.nodeData[node] || {},
      dynamic: dynamicItemData.dynamicNodeData[node] || {},
    };
    const size = visualGetters.getNodeSize ? visualGetters.getNodeSize(data) : DEFAULT_NODE_SIZE;
    const fixed =
      sigmaGraph.getNodeAttribute(node, "dragging") === true ||
      (fixedAttr !== null && dataset.nodeData[node]?.[fixedAttr] === true);

    layoutGraph.addNode(node, { x, y, size, fixed });
  });

  filteredGraph.forEachEdge((edge, _attrs, source, target) => {
    const data: StaticDynamicItemData = {
      static: dataset.edgeData[edge] || {},
      dynamic: dynamicItemData.dynamicEdgeData[edge] || {},
    };
    const weight = visualGetters.getEdgeSize ? visualGetters.getEdgeSize(data) : DEFAULT_EDGE_SIZE;
    if (filteredGraph.isDirected(edge)) {
      layoutGraph.addDirectedEdgeWithKey(edge, source, target, { weight });
    } else {
      layoutGraph.addUndirectedEdgeWithKey(edge, source, target, { weight });
    }
  });

  return layoutGraph;
}

/**
 * Creates a layout supervisor that runs on a pre-built layout graph and syncs
 * positions back to the sigma graph on each tick.
 */
export function createLayoutSupervisor(
  SupervisorClass: ContinuousLayoutSupervisorConstructor,
  layoutGraph: MultiGraph,
  sigmaGraph: Graph,
  options: unknown,
  toSigma?: CoordinateGetter,
): { supervisor: ContinuousLayoutSupervisorInterface; getPositions: () => LayoutMapping } {
  const syncToSigma = () => {
    sigmaGraph.updateEachNodeAttributes((node, attrs) => {
      if (!layoutGraph.hasNode(node)) return attrs;
      const { x, y } = layoutGraph.getNodeAttributes(node);
      if (toSigma) {
        const pos = toSigma({ x, y });
        attrs.x = pos.x;
        attrs.y = pos.y;
      } else {
        attrs.x = x;
        attrs.y = y;
      }
      return attrs;
    });
  };
  layoutGraph.on("eachNodeAttributesUpdated", syncToSigma);

  const inner = new SupervisorClass(layoutGraph, { settings: options });

  return {
    supervisor: {
      start: () => inner.start(),
      stop: () => inner.stop(),
      kill: () => {
        inner.kill();
        layoutGraph.off("eachNodeAttributesUpdated", syncToSigma);
      },
      isRunning: () => inner.isRunning(),
    },
    getPositions: () => {
      const positions: LayoutMapping = {};
      layoutGraph.forEachNode((node, { x, y }) => {
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

  const fnRestart = debounce(restartLastLayout, 100, { leading: true, trailing: true, maxWait: 100 });
  emitter.on(EVENTS.nodesDragged, fnRestart);
  emitter.on(EVENTS.graphImported, fnRestart);
  return () => {
    emitter.off(EVENTS.nodesDragged, fnRestart);
    emitter.off(EVENTS.graphImported, fnRestart);
  };
});
