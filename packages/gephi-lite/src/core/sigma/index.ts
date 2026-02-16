import { Producer, atom, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { Extent } from "graphology-metrics/graph/extent";
import { max } from "lodash";
import Sigma from "sigma";

import { MERCATOR_WORLD } from "../../utils/geo";
import { appearanceAtom } from "../appearance";
import { filteredGraphAtom, graphDatasetAtom, sigmaGraphAtom, visualGettersAtom } from "../graph";
import { SigmaState } from "./types";
import { getEmptySigmaState } from "./utils";

/**
 * Producers:
 * **********
 */
export const resetState: Producer<SigmaState, []> = () => {
  return () => getEmptySigmaState();
};

export const setEmphasizedNodes: Producer<SigmaState, [Set<string> | null]> = (items) => {
  return (state) => ({
    ...state,
    emphasizedNodes: items,
  });
};
export const resetEmphasizedNodes: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    emphasizedNodes: null,
  });
};

export const setEmphasizedEdges: Producer<SigmaState, [Set<string> | null]> = (items) => {
  return (state) => ({
    ...state,
    emphasizedEdges: items,
  });
};
export const resetEmphasizedEdges: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    emphasizedEdges: null,
  });
};

export const setHoveredNode: Producer<SigmaState, [string | null]> = (node) => {
  return (state) => ({
    ...state,
    hoveredNode: node,
  });
};
export const resetHoveredNode: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    hoveredNode: null,
  });
};

export const setHoveredEdge: Producer<SigmaState, [string | null]> = (edge) => {
  return (state) => ({
    ...state,
    hoveredEdge: edge,
  });
};
export const resetHoveredEdge: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    hoveredEdge: null,
  });
};

export const setHighlightedNodes: Producer<SigmaState, [Set<string> | null]> = (items) => {
  return (state) => ({
    ...state,
    highlightedNodes: items,
  });
};
export const resetHighlightedNodes: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    highlightedNodes: null,
  });
};

export const setCursor: Producer<SigmaState, [SigmaState["customCursor"]]> = (cursor) => {
  return (state) => ({
    ...state,
    customCursor: cursor,
  });
};

/**
 * Public API:
 * ***********
 */
// creating a dummy sigma instance to init the atom
const INITIAL_SIGMA_INSTANCE = new Sigma(new Graph(), document.createElement("div"), {
  allowInvalidContainer: true,
});
export type GephiLiteSigma = typeof INITIAL_SIGMA_INSTANCE;
export const sigmaAtom = atom(INITIAL_SIGMA_INSTANCE);
export const sigmaStateAtom = atom<SigmaState>(getEmptySigmaState());

/**
 * This function sets sigma's bounding box so that the whole graph is on screen,
 * with default camera state.
 *
 * If `forceRefresh` is true, a `sigma.refresh()` is called right after.
 *
 * The `source` parameter matters as well, since it determines whether the
 * bounding should be computed on the sigma graph or the dataset:
 * - When an "iterative" layout algorithm is running (FA2 for instance), then
 *   sigma has the latest data
 * - When this is called right after applying a single step layout algorithm
 *   (circular for instance), then the dataset is updated before, and using
 *   sigma as the source would require having a first rendered frame with the
 *   "old" bounding box
 */
/**
 * Sets MERCATOR_WORLD bbox and fits the camera to a Mercator extent.
 */
function fitCameraToMercatorExtent(
  sigma: Sigma,
  extent: { minX: number; minY: number; maxX: number; maxY: number },
) {
  sigma.setCustomBBox(MERCATOR_WORLD);
  sigma.getCamera().setState({ angle: 0, x: 0.5, y: 0.5, ratio: 1 });

  if (extent.minX > extent.maxX || extent.minY > extent.maxY) return;

  const centerX = (extent.minX + extent.maxX) / 2;
  const centerY = (extent.minY + extent.maxY) / 2;
  const extentW = extent.maxX - extent.minX;
  const extentH = extent.maxY - extent.minY;

  // Visible range at ratio=1 with a 1×1 bbox: sigma fits the square to the
  // viewport preserving aspect ratio, so the longer axis spans W/H or H/W.
  const { width, height } = sigma.getDimensions();
  const visibleW = width >= height ? width / height : 1;
  const visibleH = width >= height ? 1 : height / width;

  const margin = 1.1;
  const ratio = Math.max((extentW * margin) / visibleW, (extentH * margin) / visibleH, 0.01);
  sigma.getCamera().setState({ angle: 0, x: centerX, y: centerY, ratio });
}

/**
 * Computes the Mercator extent of all nodes by projecting dataset positions
 * through the given coordinate getter.
 */
function computeMercatorExtent(
  layout: Record<string, { x: number; y: number }>,
  getNodePosition: (pos: { x: number; y: number }) => { x: number; y: number },
) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node in layout) {
    const pos = getNodePosition(layout[node]);
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  }
  return { minX, minY, maxX, maxY };
}

export const resetCamera = ({
  source = "dataset",
  forceRefresh,
}: {
  forceRefresh?: boolean;
  source?: "sigma" | "dataset";
} = {}) => {
  const sigma = sigmaAtom.get();
  const sigmaGraph = sigmaGraphAtom.get();
  const appearance = appearanceAtom.get();
  const isMapMode = appearance.backgroundLayer?.type === "map";

  if (isMapMode) {
    const dataset = graphDatasetAtom.get();
    const visualGetters = visualGettersAtom.get();
    if (visualGetters.getNodePosition) {
      fitCameraToMercatorExtent(sigma, computeMercatorExtent(dataset.layout, visualGetters.getNodePosition));
    }
  } else {
    sigma.getCamera().setState({ angle: 0, x: 0.5, y: 0.5, ratio: 1 });

    if (source === "dataset") {
      const dataset = graphDatasetAtom.get();
      const filteredGraph = filteredGraphAtom.get();

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      const nodes = filteredGraph.nodes();
      for (let i = 0, l = nodes.length; i < l; i++) {
        const node = nodes[i];
        const { x, y } = dataset.layout[node];
        const size = (sigmaGraph.hasNode(node) && sigmaGraph.getNodeAttribute(node, "size")) || 0;

        minX = Math.min(minX, x - size);
        minY = Math.min(minY, y - size);
        maxX = Math.max(maxX, x + size);
        maxY = Math.max(maxY, y + size);
      }

      // This bit of code prevents zooming fully on the graph, when there are only 1, 2 or 3 nodes:
      const extentX = maxX - minX;
      const extentY = maxY - minY;
      const marginFactor = Math.max(3 - nodes.length, 0);

      const bbox = {
        x: [minX - marginFactor * extentX, maxX + marginFactor * extentX] as Extent,
        y: [minY - marginFactor * extentY, maxY + marginFactor * extentY] as Extent,
      };
      sigma.setCustomBBox(bbox);
    } else {
      sigma.setCustomBBox(sigma.getBBox());
    }
  }

  if (forceRefresh) sigma.refresh();
};

// Reset camera automatically when map mode is toggled on/off.
// Uses visualGettersAtom (not sigmaGraphAtom) because sigmaGraphAtom returns the
// same object reference and its bindEffect may not fire. For the map transition,
// Mercator extent is computed directly from dataset + visual getters so we don't
// depend on the debounced sigmaGraphAtom rebuild.
let _prevIsMapMode: boolean | null = null;
visualGettersAtom.bindEffect((visualGetters): undefined => {
  const appearance = appearanceAtom.get();
  const isMapMode = appearance.backgroundLayer?.type === "map";
  const wasMapMode = _prevIsMapMode;
  _prevIsMapMode = isMapMode;
  if (wasMapMode === null || wasMapMode === isMapMode) return;

  if (!isMapMode) {
    resetCamera({ forceRefresh: true });
    return;
  }

  const sigma = sigmaAtom.get();
  const dataset = graphDatasetAtom.get();
  if (visualGetters.getNodePosition) {
    fitCameraToMercatorExtent(sigma, computeMercatorExtent(dataset.layout, visualGetters.getNodePosition));
  } else {
    sigma.setCustomBBox(MERCATOR_WORLD);
    sigma.getCamera().setState({ angle: 0, x: 0.5, y: 0.5, ratio: 1 });
  }
  sigma.refresh();
});

export const sigmaActions = {
  resetState: producerToAction(resetState, sigmaStateAtom),
  setEmphasizedNodes: producerToAction(setEmphasizedNodes, sigmaStateAtom),
  resetEmphasizedNodes: producerToAction(resetEmphasizedNodes, sigmaStateAtom),
  setEmphasizedEdges: producerToAction(setEmphasizedEdges, sigmaStateAtom),
  resetEmphasizedEdges: producerToAction(resetEmphasizedEdges, sigmaStateAtom),
  setHoveredNode: producerToAction(setHoveredNode, sigmaStateAtom),
  resetHoveredNode: producerToAction(resetHoveredNode, sigmaStateAtom),
  setHoveredEdge: producerToAction(setHoveredEdge, sigmaStateAtom),
  resetHoveredEdge: producerToAction(resetHoveredEdge, sigmaStateAtom),
  setHighlightedNodes: producerToAction(setHighlightedNodes, sigmaStateAtom),
  resetHighlightedNodes: producerToAction(resetHighlightedNodes, sigmaStateAtom),
  setCursor: producerToAction(setCursor, sigmaStateAtom),
} as const;

const ANIMATION_DURATION = 500;
const HIGHLIGHT_DURATION = 2000;
let focusTimeOutId: number | null = null;
export function focusCameraOnNode(id: string) {
  if (focusTimeOutId) clearTimeout(focusTimeOutId);
  sigmaActions.resetHighlightedNodes();

  const sigma = sigmaAtom.get();
  const nodeDisplayData = sigma.getNodeDisplayData(id);
  const graphDimensions = sigma.getGraphDimensions();
  if (nodeDisplayData) {
    sigma.getCamera().animate(
      {
        x: nodeDisplayData.x,
        y: nodeDisplayData.y,
        // we zoom to see a box of X times the size of the node
        ratio: max([
          (nodeDisplayData.size * 10) / graphDimensions.width,
          (nodeDisplayData.size * 10) / graphDimensions.height,
        ]) as number,
      },
      { duration: ANIMATION_DURATION },
    );
  }

  // Higlight nodes during X seconds
  sigmaActions.setHighlightedNodes(new Set([id]));
  focusTimeOutId = window.setTimeout(() => {
    sigmaActions.resetHighlightedNodes();
    focusTimeOutId = null;
  }, HIGHLIGHT_DURATION);
}

export function focusCameraOnEdge(id: string) {
  if (focusTimeOutId) clearTimeout(focusTimeOutId);
  sigmaActions.resetHighlightedNodes();

  const sigma = sigmaAtom.get();
  const sourceId = sigma.getGraph().source(id);
  const sourceDisplayData = sigma.getNodeDisplayData(sourceId);
  const sourceData = sigma.getGraph().getNodeAttributes(sourceId);

  const targetId = sigma.getGraph().target(id);
  const targetDisplayData = sigma.getNodeDisplayData(targetId);
  const targetData = sigma.getGraph().getNodeAttributes(targetId);

  if (sourceData && targetData && targetDisplayData && sourceDisplayData) {
    // margin is the size of the biggest node;
    const margin = max([sourceDisplayData?.size, targetDisplayData?.size, 10]) as number;

    // we compute the width/height of the edge (with margin) in  the graph referencial
    const focusWidth = Math.abs(targetData.x - sourceData.x) + margin * 2;
    const focusHeight = Math.abs(targetData.y - sourceData.y) + margin * 2;

    // we compute the zoom ratio (in the graph ref, which should be the same in the viewport)
    const graphDimensions = sigma.getGraphDimensions();
    const focusRatio = max([focusHeight / graphDimensions.height, focusWidth / graphDimensions.width]) as number;

    sigma.getCamera().animate(
      {
        x: (sourceDisplayData.x + targetDisplayData.x) / 2,
        y: (sourceDisplayData.y + targetDisplayData.y) / 2,
        ratio: focusRatio,
      },
      { duration: ANIMATION_DURATION },
    );
  }

  // Higlight nodes during X seconds
  sigmaActions.setHighlightedNodes(new Set([sourceId, targetId]));
  focusTimeOutId = window.setTimeout(() => {
    sigmaActions.resetHighlightedNodes();
    focusTimeOutId = null;
  }, HIGHLIGHT_DURATION);
}
