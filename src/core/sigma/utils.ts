import { SigmaState } from "./types";

/**
 * Returns an empty sigma state:
 */
export function getEmptySigmaState(): SigmaState {
  return {
    emphasizedNodes: null,
    emphasizedEdges: null,
    hoveredNode: null,
    hoveredEdge: null,
    highlightedNodes: null,
  };
}
