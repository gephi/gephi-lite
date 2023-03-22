import { FC, useEffect } from "react";
import { useSigma } from "@react-sigma/core";

import { memoizedBrighten } from "../../../utils/colors";
import { useSelection, useSigmaState } from "../../../core/context/dataContexts";
import { CustomEdgeDisplayData, CustomNodeDisplayData } from "../../../core/appearance/types";
import { DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR } from "../../../core/appearance/utils";

export const AppearanceController: FC = () => {
  const sigma = useSigma();
  const selection = useSelection();
  const { highlightedNodes, highlightedEdges, hoveredNode, hoveredEdge } = useSigmaState();

  // Reducers:
  useEffect(() => {
    const allHighlightedNodes = new Set([
      ...(selection.type === "nodes" ? Array.from(selection.items) : []),
      ...(hoveredNode ? [hoveredNode] : []),
      ...(highlightedNodes ? Array.from(highlightedNodes) : []),
    ]);
    const allHighlightedEdges = new Set([
      ...(selection.type === "edges" ? Array.from(selection.items) : []),
      ...(hoveredEdge ? [hoveredEdge] : []),
      ...(highlightedEdges ? Array.from(highlightedEdges) : []),
    ]);
    const hasHighlightedNodes = !!allHighlightedNodes.size;
    const hasHighlightedEdges = !!allHighlightedEdges.size;

    sigma.setSetting("nodeReducer", (id, attr) => {
      const res = { ...attr } as Partial<CustomNodeDisplayData>;

      if (hasHighlightedNodes && !allHighlightedNodes.has(id)) {
        res.hideLabel = true;
        res.borderColor = res.color;
        res.color = memoizedBrighten(res.color || DEFAULT_NODE_COLOR);
      }

      if (allHighlightedNodes.has(id)) {
        res.boldLabel = true;
      }

      return res;
    });
    sigma.setSetting("edgeReducer", (id, attr) => {
      const res = { ...attr } as Partial<CustomEdgeDisplayData>;

      if (hasHighlightedEdges && !allHighlightedEdges.has(id)) {
        res.color = memoizedBrighten(res.color || DEFAULT_EDGE_COLOR);
      }

      return res;
    });
  }, [highlightedEdges, highlightedNodes, hoveredEdge, hoveredNode, selection, sigma]);

  return null;
};
