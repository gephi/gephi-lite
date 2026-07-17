import { Producer, atom, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { Extent } from "graphology-metrics/graph/extent";
import { max } from "lodash";
import Sigma from "sigma";
import { CameraState } from "sigma/types";

import { filteredGraphAtom, graphDatasetAtom, sigmaGraphAtom } from "../graph";
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
export const resetCamera = ({
  source = "dataset",
  forceRefresh,
}: {
  forceRefresh?: boolean;
  source?: "sigma" | "dataset";
} = {}) => {
  const sigma = sigmaAtom.get();
  const sigmaGraph = sigmaGraphAtom.get();
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

  if (forceRefresh) sigma.refresh();
};

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

// A focus request that must be replayed once the graph page (and its sigma instance) is mounted
// and ready. Used when "locating" an item from another page (e.g. the data table): we navigate to
// the graph, and the graph page consumes this pending focus once ready (see consumePendingFocus).
let pendingFocus: { type: "nodes" | "edges"; id: string } | null = null;

/**
 * Runs `run` once the graph area (".filler") has stopped resizing.
 *
 * On mobile, selecting an item deploys a panel that takes half of the height, and the ".filler"
 * (the visible graph band) shrinks over a CSS transition. Since selecting + focusing happen
 * synchronously, the framing would otherwise be computed against the *pre-transition* band (full
 * height) and end up hidden behind the panel / zoomed for the wrong area. We therefore wait for the
 * band to settle before framing. On desktop nothing is transitioning, so it runs almost immediately.
 */
function runWhenGraphBandSettled(run: () => void) {
  const getHeight = () => document.querySelector(".filler")?.getBoundingClientRect().height ?? 0;
  const start = performance.now();
  let lastHeight = getHeight();
  let stableFrames = 0;
  const tick = () => {
    const height = getHeight();
    stableFrames = Math.abs(height - lastHeight) < 0.5 ? stableFrames + 1 : 0;
    lastHeight = height;
    // Settled once the height held steady for a couple of frames, or give up after ~500ms:
    if (stableFrames >= 2 || performance.now() - start > 500) run();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Computes a camera state that frames the given nodes so that their disks AND their labels
 * fit entirely inside the *visible* part of the graph.
 *
 * The sigma canvas spans more than what the user sees: the header and the left/right panels
 * are drawn on top of it. The ".filler" element is exactly the graph rectangle left visible
 * between them, whatever panels happen to be open or closed, so we frame the nodes inside it.
 *
 * Node sizes are expressed in position units (itemSizesReference: "positions"), so the disks
 * scale with the zoom, whereas labels are drawn at a fixed pixel size. We therefore reason in
 * viewport pixels: for each node we split its footprint into the part that scales with the
 * zoom (the disk) and the fixed part (its label), then solve for the zoom factor that keeps
 * everything within the visible band (minus some padding), and finally pan so the nodes are
 * centered inside that band rather than inside the whole canvas.
 */
function getCameraStateToFrameNodes(sigma: Sigma, nodeIds: string[]): CameraState {
  const graph = sigma.getGraph();
  const camera = sigma.getCamera();
  const ids = Array.from(new Set(nodeIds)).filter((id) => graph.hasNode(id) && !!sigma.getNodeDisplayData(id));
  if (!ids.length) return camera.getState();

  const { width, height } = sigma.getDimensions();
  const currentRatio = camera.ratio || 1;
  const PADDING = 28; // px of breathing room kept on each side of the visible band

  // Visible band, in viewport coordinates (0,0 = canvas top-left). ".filler" is the graph
  // area left uncovered by the panels/header; fall back to the whole canvas if absent.
  const containerRect = sigma.getContainer().getBoundingClientRect();
  const fillerRect = document.querySelector(".filler")?.getBoundingClientRect();
  const bandLeft = fillerRect ? fillerRect.left - containerRect.left : 0;
  const bandTop = fillerRect ? fillerRect.top - containerRect.top : 0;
  const bandWidth = fillerRect ? fillerRect.width : width;
  const bandHeight = fillerRect ? fillerRect.height : height;
  const bandCenterX = bandLeft + bandWidth / 2;
  const bandCenterY = bandTop + bandHeight / 2;

  // Labels are rendered at a fixed pixel size: prepare a canvas to measure their width.
  const ctx = document.createElement("canvas").getContext("2d");
  const labelSize = (sigma.getSetting("labelSize") as number) || 14;
  const labelFont = (sigma.getSetting("labelFont") as string) || "sans-serif";
  const labelWeight = (sigma.getSetting("labelWeight") as string) || "normal";
  if (ctx) ctx.font = `${labelWeight} ${labelSize}px ${labelFont}`;

  // Node coordinates: framed (what camera.x/y use) and raw (what graphToViewport projects).
  const framed = ids.map((id) => sigma.getNodeDisplayData(id) as { x: number; y: number });
  const raws = ids.map((id) => graph.getNodeAttributes(id) as { x: number; y: number; size?: number });
  const midFramedX = (Math.min(...framed.map((d) => d.x)) + Math.max(...framed.map((d) => d.x))) / 2;
  const midFramedY = (Math.min(...framed.map((d) => d.y)) + Math.max(...framed.map((d) => d.y))) / 2;
  const midRawX = (Math.min(...raws.map((a) => a.x)) + Math.max(...raws.map((a) => a.x))) / 2;
  const midRawY = (Math.min(...raws.map((a) => a.y)) + Math.max(...raws.map((a) => a.y))) / 2;
  const centerVp = sigma.graphToViewport({ x: midRawX, y: midRawY });

  const availHalfW = Math.max(1, bandWidth / 2 - PADDING);
  const availHalfH = Math.max(1, bandHeight / 2 - PADDING);

  // Zoom factor relative to the current zoom (> 1 zooms in). We keep the most constraining node.
  let factor = Infinity;
  ids.forEach((id, i) => {
    const a = raws[i];
    const nodeVp = sigma.graphToViewport({ x: a.x, y: a.y });
    const border = sigma.graphToViewport({ x: a.x + (a.size || 0), y: a.y });
    const radiusPx = Math.abs(border.x - nodeVp.x);
    const labelPx = ctx ? ctx.measureText(sigma.getNodeDisplayData(id)?.label || "").width : 0;

    // Half-extent (px) from the target center that scales with the zoom (the disk):
    const scalingX = Math.abs(nodeVp.x - centerVp.x) + radiusPx;
    const scalingY = Math.abs(nodeVp.y - centerVp.y) + radiusPx;
    // The label (right of the node) and the label height do not scale: reserve them as fixed px.
    if (scalingX > 0) factor = Math.min(factor, Math.max(availHalfW - labelPx, 1) / scalingX);
    if (scalingY > 0) factor = Math.min(factor, Math.max(availHalfH - labelSize / 2, 1) / scalingY);
  });
  if (!isFinite(factor) || factor <= 0) factor = 1;

  // Pan so the nodes are centered inside the visible band (and not the whole canvas). We
  // convert the pixel offset (band center vs canvas center) into framed units. The framed
  // distance per viewport pixel is derived from two distinct nodes and scaled to the new zoom.
  let camX = midFramedX;
  let camY = midFramedY;
  if (ids.length >= 2) {
    const vp0 = sigma.graphToViewport({ x: raws[0].x, y: raws[0].y });
    let far = 1;
    let farDist = -1;
    for (let i = 1; i < ids.length; i++) {
      const v = sigma.graphToViewport({ x: raws[i].x, y: raws[i].y });
      const d = Math.hypot(v.x - vp0.x, v.y - vp0.y);
      if (d > farDist) [farDist, far] = [d, i];
    }
    const vpFar = sigma.graphToViewport({ x: raws[far].x, y: raws[far].y });
    const dvx = vpFar.x - vp0.x;
    const dvy = vpFar.y - vp0.y;
    const magnitude = farDist > 1e-6 ? Math.hypot(framed[far].x - framed[0].x, framed[far].y - framed[0].y) / farDist : 0;
    // Per-axis signed framed-units-per-pixel (same magnitude on both axes; sigma flips Y).
    const framedPerPxX = Math.abs(dvx) > 1e-6 ? (framed[far].x - framed[0].x) / dvx : magnitude;
    const framedPerPxY = Math.abs(dvy) > 1e-6 ? (framed[far].y - framed[0].y) / dvy : -magnitude;
    camX = midFramedX - ((bandCenterX - width / 2) * framedPerPxX) / factor;
    camY = midFramedY - ((bandCenterY - height / 2) * framedPerPxY) / factor;
  }

  return { ...camera.getState(), angle: 0, x: camX, y: camY, ratio: currentRatio / factor };
}

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
  focusCameraOnEdges([id]);
}

export function focusCameraOnEdges(ids: string[]) {
  if (focusTimeOutId) clearTimeout(focusTimeOutId);
  sigmaActions.resetHighlightedNodes();

  const sigma = sigmaAtom.get();
  const graph = sigma.getGraph();

  // Collect every endpoint of the given edges that is actually rendered.
  const endpoints = new Set<string>();
  ids.forEach((id) => {
    if (!graph.hasEdge(id)) return;
    const sourceId = graph.source(id);
    const targetId = graph.target(id);
    if (sigma.getNodeDisplayData(sourceId) && sigma.getNodeDisplayData(targetId)) {
      endpoints.add(sourceId);
      endpoints.add(targetId);
    }
  });
  if (!endpoints.size) return;

  // Frame all the edges so that their endpoints' disks and labels fit entirely within the
  // viewport visible between the panels. We wait for the graph band to settle first, so on mobile
  // the framing accounts for the selection panel that just opened (and halved the visible height).
  runWhenGraphBandSettled(() =>
    sigma
      .getCamera()
      .animate(getCameraStateToFrameNodes(sigma, Array.from(endpoints)), { duration: ANIMATION_DURATION }),
  );

  // Higlight nodes during X seconds
  sigmaActions.setHighlightedNodes(endpoints);
  focusTimeOutId = window.setTimeout(() => {
    sigmaActions.resetHighlightedNodes();
    focusTimeOutId = null;
  }, HIGHLIGHT_DURATION);
}

// Register a focus to be replayed once the graph page's sigma instance is mounted and ready.
// Used to "locate" an item from a page where sigma is not mounted (e.g. the data table).
export function requestFocusOnReady(type: "nodes" | "edges", id: string) {
  pendingFocus = { type, id };
}

// True once sigma has rendered/normalized the graph on its current instance: the node's display
// (framed) coordinates then differ from its raw layout coordinates. Right after navigation, sigma
// briefly reports raw coordinates as display data; focusing then would frame against unnormalized
// coordinates and send the camera into empty space. (When the graph is already normalized the two
// coincide, in which case focusing on the raw coordinates is correct anyway.)
function isNodeFramed(sigma: GephiLiteSigma, nodeId: string): boolean {
  const graph = sigma.getGraph();
  if (!graph.hasNode(nodeId)) return false;
  const dd = sigma.getNodeDisplayData(nodeId);
  if (!dd) return false;
  return dd.x !== graph.getNodeAttribute(nodeId, "x") || dd.y !== graph.getNodeAttribute(nodeId, "y");
}

// Replay any pending focus request. Called by the graph page once its sigma instance is ready.
// The focus is deferred (via animation frames) until the container has real pixel dimensions and
// sigma has framed the target item, so the camera animates to the right place.
export function consumePendingFocus() {
  if (!pendingFocus) return;
  const focus = pendingFocus;
  pendingFocus = null;

  let attempts = 0;
  const tryFocus = () => {
    const sigma = sigmaAtom.get();
    const graph = sigma.getGraph();
    const { width, height } = sigma.getDimensions();
    const anchorNode = focus.type === "nodes" ? focus.id : graph.hasEdge(focus.id) ? graph.source(focus.id) : null;
    const ready = width > 0 && height > 0 && anchorNode !== null && isNodeFramed(sigma, anchorNode);

    // Give up gracefully after ~1s (60 frames): focus best-effort rather than never.
    if (ready || attempts++ >= 60) {
      if (focus.type === "nodes") focusCameraOnNode(focus.id);
      else focusCameraOnEdge(focus.id);
    } else {
      requestAnimationFrame(tryFocus);
    }
  };
  requestAnimationFrame(tryFocus);
}
