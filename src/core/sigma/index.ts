import Sigma from "sigma";

import { SigmaState } from "./types";
import { atom } from "../utils/atoms";
import { filteredGraphAtom, graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { SigmaGraph } from "../graph/types";
import { getEmptySigmaState } from "./utils";
import { Producer, producerToAction } from "../utils/reducers";
import { nodeExtent } from "graphology-metrics/graph";
import { dataGraphToSigmaGraph } from "../graph/utils";

/**
 * Producers:
 * **********
 */
export const resetState: Producer<SigmaState, []> = () => {
  return () => getEmptySigmaState();
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

export const setHighlightedEdges: Producer<SigmaState, [Set<string> | null]> = (items) => {
  return (state) => ({
    ...state,
    highlightedEdges: items,
  });
};
export const resetHighlightedEdges: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    highlightedEdges: null,
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

/**
 * Public API:
 * ***********
 */
export const sigmaAtom = atom<Sigma<SigmaGraph>>(
  new Sigma(sigmaGraphAtom.get(), document.createElement("div"), { allowInvalidContainer: true }),
);
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
  sigma.getCamera().setState({ angle: 0, x: 0.5, y: 0.5, ratio: 1 });

  if (source === "dataset") {
    const dataset = graphDatasetAtom.get();
    const filteredGraph = filteredGraphAtom.get();
    const graph = dataGraphToSigmaGraph(dataset, filteredGraph);
    const bbox = { x: nodeExtent(graph, "x"), y: nodeExtent(graph, "y") };
    sigma.setCustomBBox(bbox);
  } else {
    sigma.setCustomBBox(sigma.getBBox());
  }

  if (forceRefresh) sigma.refresh();
};

export const sigmaActions = {
  resetState: producerToAction(resetState, sigmaStateAtom),
  setHighlightedNodes: producerToAction(setHighlightedNodes, sigmaStateAtom),
  resetHighlightedNodes: producerToAction(resetHighlightedNodes, sigmaStateAtom),
  setHighlightedEdges: producerToAction(setHighlightedEdges, sigmaStateAtom),
  resetHighlightedEdges: producerToAction(resetHighlightedEdges, sigmaStateAtom),
  setHoveredNode: producerToAction(setHoveredNode, sigmaStateAtom),
  resetHoveredNode: producerToAction(resetHoveredNode, sigmaStateAtom),
  setHoveredEdge: producerToAction(setHoveredEdge, sigmaStateAtom),
  resetHoveredEdge: producerToAction(resetHoveredEdge, sigmaStateAtom),
} as const;
