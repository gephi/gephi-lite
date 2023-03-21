import { SigmaState } from "./types";
import { atom } from "../utils/atoms";
import { getEmptySigmaState } from "./utils";
import { Producer, producerToAction } from "../utils/reducers";

/**
 * Producers:
 * **********
 */
export const setHighlightedNodes: Producer<SigmaState, [Set<string> | undefined]> = (items) => {
  return (state) => ({
    ...state,
    highlightedNodes: items || new Set<string>(),
  });
};
export const resetHighlightedNodes: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    highlightedNodes: new Set<string>(),
  });
};

export const setHighlightedEdges: Producer<SigmaState, [Set<string> | undefined]> = (items) => {
  return (state) => ({
    ...state,
    highlightedEdges: items || new Set<string>(),
  });
};
export const resetHighlightedEdges: Producer<SigmaState, []> = () => {
  return (state) => ({
    ...state,
    highlightedEdges: new Set<string>(),
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
export const sigmaStateAtom = atom<SigmaState>(getEmptySigmaState());

export const sigmaActions = {
  setHighlightedNodes: producerToAction(setHighlightedNodes, sigmaStateAtom),
  resetHighlightedNodes: producerToAction(resetHighlightedNodes, sigmaStateAtom),
  setHighlightedEdges: producerToAction(setHighlightedEdges, sigmaStateAtom),
  resetHighlightedEdges: producerToAction(resetHighlightedEdges, sigmaStateAtom),
  setHoveredNode: producerToAction(setHoveredNode, sigmaStateAtom),
  resetHoveredNode: producerToAction(resetHoveredNode, sigmaStateAtom),
  setHoveredEdge: producerToAction(setHoveredEdge, sigmaStateAtom),
  resetHoveredEdge: producerToAction(resetHoveredEdge, sigmaStateAtom),
} as const;
