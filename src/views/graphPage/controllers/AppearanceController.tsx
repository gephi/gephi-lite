import { FC, useEffect } from "react";
import { useSigma } from "@react-sigma/core";

import { memoizedBrighten } from "../../../utils/colors";
import { useAppearance, useGraphDataset, useSelection, useSigmaState } from "../../../core/context/dataContexts";
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_EDGE_SIZE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZE,
} from "../../../core/appearance/utils";
import { CustomEdgeDisplayData, CustomNodeDisplayData } from "../../../core/appearance/types";

export const AppearanceController: FC = () => {
  const sigma = useSigma();
  const selection = useSelection();
  const { showEdges } = useAppearance();
  const { metadata } = useGraphDataset();
  const { highlightedNodes, highlightedEdges, hoveredNode } = useSigmaState();

  // Reducers:
  useEffect(() => {
    const graph = sigma.getGraph();
    const edgeArrow = metadata.type !== "undirected";

    // what we've got in the state,
    //  or
    //    the node selection,
    //    the hover node plus its neighbor
    const allHighlightedNodes =
      highlightedNodes ||
      new Set([
        ...(selection.type === "nodes" ? Array.from(selection.items) : []),
        ...(hoveredNode ? [hoveredNode, ...graph.neighbors(hoveredNode)] : []),
      ]);

    // What we've got in state
    //  or edges linked to an highlightedNodes
    //  or
    //    edges in selection
    //    edges hovered
    //    edges in neighbor of the node hovered
    const allHighlightedEdges = highlightedNodes
      ? new Set(
          graph.filterEdges(
            (edge, _attr, source, target) => highlightedNodes.has(source) && highlightedNodes.has(target),
          ),
        )
      : highlightedEdges ||
        new Set([
          ...(selection.type === "edges" ? Array.from(selection.items) : []),
          ...(hoveredNode ? graph.edges(hoveredNode) : []),
        ]);
    const hasHighlightedNodes = !!allHighlightedNodes.size;
    const hasHighlightedEdges = !!allHighlightedEdges.size;

    sigma.setSetting("nodeReducer", (id, attr) => {
      const res = structuredClone(attr) as Partial<CustomNodeDisplayData>;
      res.zIndex = 0;
      res.rawSize = res.size || DEFAULT_NODE_SIZE;

      if (hasHighlightedNodes && !allHighlightedNodes.has(id)) {
        res.hideLabel = true;
        res.borderColor = res.color;
        res.color = memoizedBrighten(res.color || DEFAULT_NODE_COLOR);
        res.zIndex = -1;
      }

      if (id === hoveredNode) res.highlighted = true;

      if (allHighlightedNodes.has(id)) {
        res.forceLabel = true;
        res.zIndex = 1;
      }

      return res;
    });
    sigma.setSetting(
      "edgeReducer",
      !showEdges
        ? () => ({ hidden: true })
        : (id, { weight, ...attr }) => {
            const res = { ...attr, size: weight, type: edgeArrow ? "arrow" : "line" } as Partial<CustomEdgeDisplayData>;
            res.zIndex = 0;
            res.rawSize = res.size || DEFAULT_EDGE_SIZE;

            if (hasHighlightedEdges && !allHighlightedEdges.has(id)) {
              res.color = memoizedBrighten(res.color || DEFAULT_EDGE_COLOR);
              res.zIndex = -1;
            }

            return res;
          },
    );
  }, [highlightedEdges, highlightedNodes, hoveredNode, selection, showEdges, sigma, metadata.type]);

  return null;
};
