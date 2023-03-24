import Sigma from "sigma";

import { SigmaState } from "./types";
import { atom } from "../utils/atoms";
import { filteredGraphAtom, graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { SigmaGraph } from "../graph/types";
import { getEmptySigmaState } from "./utils";
import { Producer, producerToAction } from "../utils/reducers";
import { nodeExtent } from "graphology-metrics/graph";
import { dataGraphToFullGraph } from "../graph/utils";

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

export const resetCamera = () => {
  const sigma = sigmaAtom.get();
  sigma.getCamera().setState({ angle: 0, x: 0.5, y: 0.5, ratio: 1 });

  const dataset = graphDatasetAtom.get();
  const filteredGraph = filteredGraphAtom.get();
  const graph = dataGraphToFullGraph(dataset, filteredGraph);
  const bbox = { x: nodeExtent(graph, "x"), y: nodeExtent(graph, "y") };
  sigma.setCustomBBox(bbox);
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
