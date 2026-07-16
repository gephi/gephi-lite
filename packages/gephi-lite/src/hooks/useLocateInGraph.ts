import { useCallback } from "react";
import { useNavigate } from "react-router";

import { useSelectionActions } from "../core/context/dataContexts";
import { focusCameraOnEdge, focusCameraOnNode, requestFocusOnReady } from "../core/sigma";

/**
 * "Locate" an item in the graph: replace the current selection with that single item, then center
 * the camera on it.
 *
 * When called with `navigateToGraph`, the caller is on a page where sigma is not mounted (e.g. the
 * data table): we register the focus as pending and navigate to the graph page, which replays it
 * once its sigma instance is ready (see requestFocusOnReady / consumePendingFocus). Otherwise the
 * camera is focused right away (caller already on the graph page).
 */
export function useLocateInGraph() {
  const { select } = useSelectionActions();
  const navigate = useNavigate();

  const locateNode = useCallback(
    (id: string, options?: { navigateToGraph?: boolean }) => {
      select({ type: "nodes", items: new Set([id]), replace: true });
      if (options?.navigateToGraph) {
        requestFocusOnReady("nodes", id);
        navigate("/");
      } else {
        focusCameraOnNode(id);
      }
    },
    [select, navigate],
  );

  const locateEdge = useCallback(
    (id: string, options?: { navigateToGraph?: boolean }) => {
      select({ type: "edges", items: new Set([id]), replace: true });
      if (options?.navigateToGraph) {
        requestFocusOnReady("edges", id);
        navigate("/");
      } else {
        focusCameraOnEdge(id);
      }
    },
    [select, navigate],
  );

  return { locateNode, locateEdge };
}
