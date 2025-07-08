export interface SigmaState {
  highlightedNodes: Set<string> | null;
  emphasizedNodes: Set<string> | null;
  emphasizedEdges: Set<string> | null;
  hoveredNode: string | null;
  hoveredEdge: string | null;
  customCursor?: "grab" | "grabbing";
}
