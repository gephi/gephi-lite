import { SigmaState } from "./types";

/**
 * Returns an empty sigma state:
 */
export function getEmptySigmaState(): SigmaState {
  return {
    highlightedNodes: null,
    highlightedEdges: null,
    hoveredNode: null,
    hoveredEdge: null,
  };
}
