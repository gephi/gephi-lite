export interface SigmaState {
  highlightedNodes: Set<string>;
  highlightedEdges: Set<string>;
  hoveredNode: string | null;
  hoveredEdge: string | null;
}
