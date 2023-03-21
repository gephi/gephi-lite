import { SigmaState } from "./types";

/**
 * Returns an empty sigma state:
 */
export function getEmptySigmaState(): SigmaState {
  return {
    highlightedNodes: new Set<string>(),
    highlightedEdges: new Set<string>(),
    hoveredNode: null,
    hoveredEdge: null,
  };
}
