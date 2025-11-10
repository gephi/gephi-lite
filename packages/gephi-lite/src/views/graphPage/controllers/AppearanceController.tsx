import {
  CustomEdgeDisplayData,
  CustomNodeDisplayData,
  DEFAULT_EDGE_COLOR,
  DEFAULT_EDGE_SIZE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZE,
} from "@gephi/gephi-lite-sdk";
import { useSigma } from "@react-sigma/core";
import { DateTime } from "luxon";
import { FC, useEffect } from "react";

import {
  useAppearance,
  useFilters,
  useGraphDataset,
  usePreferences,
  useSelection,
  useSigmaState,
} from "../../../core/context/dataContexts";
import { castScalarToModelValue } from "../../../core/graph/fieldModel";
import { GephiLiteSigma } from "../../../core/graph/types";
import { getAppliedTheme } from "../../../core/preferences/utils";
import { memoizedBrighten, memoizedDarken } from "../../../utils/colors";

export const AppearanceController: FC = () => {
  const sigma: GephiLiteSigma = useSigma();
  const selection = useSelection();
  const { showEdges } = useAppearance();
  const { fullGraph, edgeData } = useGraphDataset();
  const { theme } = usePreferences();
  const { emphasizedNodes, emphasizedEdges, hoveredNode, highlightedNodes } = useSigmaState();
  const { filters } = useFilters();

  // Reducers:
  useEffect(() => {
    const graph = sigma.getGraph();
    const mode = getAppliedTheme(theme);

    // Check for timeline filters with fadeInsteadOfHide enabled
    const timelineFilter = filters.find((f) => f.type === "timeline" && !f.disabled && f.fadeInsteadOfHide);
    const fadedEdges = new Set<string>();
    const activeNodes = new Set<string>();

    if (timelineFilter && timelineFilter.type === "timeline") {
      // Determine which edges are outside the timeline range (should be faded)
      graph.forEachEdge((edgeId) => {
        const edgeAttributes = edgeData[edgeId];
        if (!edgeAttributes) {
          fadedEdges.add(edgeId);
          return;
        }

        const scalar = edgeAttributes[timelineFilter.field.id];
        const value = castScalarToModelValue(scalar, timelineFilter.field);

        let isInRange = false;
        if (value instanceof DateTime) {
          const timestamp = value.toMillis();
          const minDate = timelineFilter.minDate ?? -Infinity;
          const maxDate = timelineFilter.maxDate ?? Infinity;
          isInRange = timestamp >= minDate && timestamp <= maxDate;
        } else if (timelineFilter.keepMissingValues) {
          isInRange = true;
        }

        if (!isInRange) {
          fadedEdges.add(edgeId);
        } else {
          // Track nodes with active edges
          const source = graph.source(edgeId);
          const target = graph.target(edgeId);
          activeNodes.add(source);
          activeNodes.add(target);
        }
      });
    }

    // what we've got in the state,
    //  or
    //    the node selection,
    //    the hover node plus its neighbor
    const allEmphasizedNodes =
      emphasizedNodes ||
      new Set([
        ...(selection.type === "nodes" ? Array.from(selection.items) : []),
        ...(hoveredNode ? [hoveredNode, ...graph.neighbors(hoveredNode)] : []),
      ]);

    // What we've got in state
    //  or edges linked to an emphasizedNodes
    //  or
    //    edges in selection
    //    edges hovered
    //    edges in neighbor of the node hovered
    const allEmphasizedEdges = emphasizedNodes
      ? new Set(
          graph.filterEdges(
            (_edge, _attr, source, target) => emphasizedNodes.has(source) && emphasizedNodes.has(target),
          ),
        )
      : emphasizedEdges ||
        new Set([
          ...(selection.type === "edges" ? Array.from(selection.items) : []),
          ...(hoveredNode ? graph.edges(hoveredNode) : []),
        ]);
    const hasEmphasizedNodes = !!allEmphasizedNodes.size;
    const hasEmphasizedEdges = !!allEmphasizedEdges.size;

    sigma.setSetting("nodeReducer", (id, attr) => {
      const res = structuredClone(attr) as Partial<CustomNodeDisplayData>;
      res.zIndex = 0;
      res.rawSize = res.size || DEFAULT_NODE_SIZE;

      // Apply fade to nodes without active edges in timeline
      if (timelineFilter && !activeNodes.has(id)) {
        res.color = res.color || DEFAULT_NODE_COLOR;
        // Extract RGB and apply very low opacity
        const rgba = res.color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (rgba) {
          const r = parseInt(rgba[1], 16);
          const g = parseInt(rgba[2], 16);
          const b = parseInt(rgba[3], 16);
          res.color = `rgba(${r}, ${g}, ${b}, 0.05)`;
        }
        res.hideLabel = true;
        res.zIndex = -2;
      }

      if (hasEmphasizedNodes && !allEmphasizedNodes.has(id)) {
        res.hideLabel = true;
        res.borderColor = res.color;
        res.color =
          mode === "dark"
            ? memoizedDarken(res.color || DEFAULT_NODE_COLOR)
            : memoizedBrighten(res.color || DEFAULT_NODE_COLOR);
        res.zIndex = -1;
        res.type = "bordered";
      }

      if (id === hoveredNode || highlightedNodes?.has(id)) res.highlighted = true;

      if (allEmphasizedNodes.has(id)) {
        res.forceLabel = true;
        res.zIndex = 1;
      }

      return res;
    });
    sigma.setSetting(
      "edgeReducer",
      !showEdges.value
        ? () => ({ hidden: true })
        : (id, { weight, ...attr }) => {
            const res = {
              ...attr,
              size: weight,
              type: graph.isDirected(id) ? "arrow" : "line",
            } as Partial<CustomEdgeDisplayData>;
            res.zIndex = res.zIndex || 0;
            res.rawSize = res.size || DEFAULT_EDGE_SIZE;

            // Apply fade to edges outside timeline range
            if (fadedEdges.has(id)) {
              res.color = res.color || DEFAULT_EDGE_COLOR;
              // Extract RGB and apply very low opacity
              const rgba = res.color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
              if (rgba) {
                const r = parseInt(rgba[1], 16);
                const g = parseInt(rgba[2], 16);
                const b = parseInt(rgba[3], 16);
                res.color = `rgba(${r}, ${g}, ${b}, 0.05)`;
              }
              res.zIndex = -2;
            }

            if (hasEmphasizedEdges && !allEmphasizedEdges.has(id)) {
              res.color =
                mode === "dark"
                  ? memoizedDarken(res.color || DEFAULT_EDGE_COLOR)
                  : memoizedBrighten(res.color || DEFAULT_EDGE_COLOR);
              res.zIndex = -1;
            }

            return res;
          },
    );
  }, [
    emphasizedEdges,
    emphasizedNodes,
    hoveredNode,
    selection,
    showEdges,
    sigma,
    highlightedNodes,
    theme,
    fullGraph.type,
    filters,
    edgeData,
  ]);

  return null;
};
