export interface SigmaState {
  highlightedNodes: Set<string> | null;
  highlightedEdges: Set<string> | null;
  hoveredNode: string | null;
  hoveredEdge: string | null;
}
