import { FC, useEffect } from "react";
import { useSigma } from "@react-sigma/core";

import { memoizedBrighten } from "../../../utils/colors";
import { useSelection, useSigmaState } from "../../../core/context/dataContexts";
import { DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR } from "../../../core/appearance/utils";
import { CustomEdgeDisplayData, CustomNodeDisplayData } from "../../../core/appearance/types";

export const AppearanceController: FC = () => {
  const sigma = useSigma();
  const selection = useSelection();
  const { highlightedNodes, highlightedEdges, hoveredNode, hoveredEdge } = useSigmaState();

  // Reducers:
  useEffect(() => {
    const graph = sigma.getGraph();
    const allHighlightedNodes =
      highlightedNodes ||
      new Set([
        ...(selection.type === "nodes" ? Array.from(selection.items) : []),
        ...(hoveredNode ? [hoveredNode] : []),
      ]);
    const allHighlightedEdges = highlightedNodes
      ? new Set(
          graph.filterEdges(
            (edge, _attr, source, target) => highlightedNodes.has(source) && highlightedNodes.has(target),
          ),
        )
      : highlightedEdges ||
        new Set([
          ...(selection.type === "edges" ? Array.from(selection.items) : []),
          ...(hoveredEdge ? [hoveredEdge] : []),
        ]);
    const hasHighlightedNodes = !!allHighlightedNodes.size;
    const hasHighlightedEdges = !!allHighlightedEdges.size;

    sigma.setSetting("nodeReducer", (id, attr) => {
      const res = { ...attr } as Partial<CustomNodeDisplayData>;
      res.zIndex = 0;

      if (hasHighlightedNodes && !allHighlightedNodes.has(id)) {
        res.hideLabel = true;
        res.borderColor = res.color;
        res.color = memoizedBrighten(res.color || DEFAULT_NODE_COLOR);
        res.zIndex = -1;
      }

      if (allHighlightedNodes.has(id)) {
        res.boldLabel = true;
        res.zIndex = 1;
      }

      return res;
    });
    sigma.setSetting("edgeReducer", (id, attr) => {
      const res = { ...attr } as Partial<CustomEdgeDisplayData>;
      res.zIndex = 0;

      if (hasHighlightedEdges && !allHighlightedEdges.has(id)) {
        res.color = memoizedBrighten(res.color || DEFAULT_EDGE_COLOR);
        res.zIndex = -1;
      }

      return res;
    });
  }, [highlightedEdges, highlightedNodes, hoveredEdge, hoveredNode, selection, sigma]);

  return null;
};
