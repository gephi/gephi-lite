import {
  CustomEdgeDisplayData,
  CustomNodeDisplayData,
  DEFAULT_EDGE_COLOR,
  DEFAULT_EDGE_SIZE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZE,
} from "@gephi/gephi-lite-sdk";
import { useSigma } from "@react-sigma/core";
import { FC, useEffect } from "react";

import {
  useAppearance,
  useGraphDataset,
  usePreferences,
  useSelection,
  useSigmaState,
} from "../../../core/context/dataContexts";
import { GephiLiteSigma } from "../../../core/graph/types";
import { getAppliedTheme } from "../../../core/preferences/utils";
import { getEmphasizedEdges, getEmphasizedNodes } from "../../../core/sigma/utils";
import { DIMMED_EDGE_RATIO, memoizedBrighten, memoizedDarken } from "../../../utils/colors";

export const AppearanceController: FC = () => {
  const sigma: GephiLiteSigma = useSigma();
  const selection = useSelection();
  const { showEdges } = useAppearance();
  const { fullGraph } = useGraphDataset();
  const { theme } = usePreferences();
  const { emphasizedNodes, emphasizedEdges, hoveredNode, highlightedNodes } = useSigmaState();

  // Reducers:
  useEffect(() => {
    const graph = sigma.getGraph();
    const mode = getAppliedTheme(theme);

    // what we've got in the state,
    //  or
    //    the node selection,
    //    the hover node plus its neighbor
    const allEmphasizedNodes = getEmphasizedNodes({ graph, selection, hoveredNode, emphasizedNodes });

    const allEmphasizedEdges = getEmphasizedEdges({ graph, selection, hoveredNode, emphasizedNodes, emphasizedEdges });
    const hasEmphasizedNodes = !!allEmphasizedNodes.size;
    const hasEmphasizedEdges = !!allEmphasizedEdges.size;

    sigma.setSetting("nodeReducer", (id, attr) => {
      const res = structuredClone(attr) as Partial<CustomNodeDisplayData>;
      res.zIndex = 0;
      res.rawSize = res.size || DEFAULT_NODE_SIZE;

      if (hasEmphasizedNodes && !allEmphasizedNodes.has(id)) {
        res.hideLabel = true;
        const dim = mode === "dark" ? memoizedDarken : memoizedBrighten;
        const nodeColor = res.color || DEFAULT_NODE_COLOR;
        // The outline takes the same color as the surface, so a node set aside reads as one flat shape.
        res.color = dim(nodeColor);
        res.borderColor = res.color;
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

            if (hasEmphasizedEdges && !allEmphasizedEdges.has(id)) {
              res.color =
                mode === "dark"
                  ? memoizedDarken(res.color || DEFAULT_EDGE_COLOR, DIMMED_EDGE_RATIO)
                  : memoizedBrighten(res.color || DEFAULT_EDGE_COLOR, DIMMED_EDGE_RATIO);
              // Set aside: drawn under the emphasized edges, and with no label so it vanishes with the color.
              res.zIndex = -1;
              res.label = null;
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
  ]);

  return null;
};
