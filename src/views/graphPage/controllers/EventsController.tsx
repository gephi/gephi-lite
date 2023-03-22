import { FC, useEffect } from "react";
import { MouseCoords } from "sigma/types";
import { useRegisterEvents } from "@react-sigma/core";

import { useSelection, useSelectionActions, useSigmaActions } from "../../../core/context/dataContexts";

export const EventsController: FC = () => {
  const registerEvents = useRegisterEvents();

  const selection = useSelection();
  const { select, toggle, reset } = useSelectionActions();
  const { setHoveredNode, resetHoveredNode, setHoveredEdge, resetHoveredEdge } = useSigmaActions();

  useEffect(() => {
    registerEvents({
      enterEdge({ edge }) {
        setHoveredEdge(edge);
      },
      leaveEdge() {
        resetHoveredEdge();
      },
      enterNode({ node }) {
        setHoveredNode(node);
      },
      leaveNode() {
        resetHoveredNode();
      },
      clickNode({ node, event }) {
        if (event.original.ctrlKey) {
          toggle({
            type: "nodes",
            item: node,
          });
        } else if (selection.type === "nodes" && selection.items.has(node) && selection.items.size === 1) {
          reset();
        } else {
          select({ type: "nodes", items: new Set([node]), replace: true });
        }
      },
      clickEdge({ edge, event }) {
        if (event.original.ctrlKey) {
          toggle({
            type: "edges",
            item: edge,
          });
        } else if (selection.type === "edges" && selection.items.has(edge) && selection.items.size === 1) {
          reset();
        } else {
          select({ type: "edges", items: new Set([edge]), replace: true });
        }
      },
      doubleClick(event: MouseCoords) {
        event.preventSigmaDefault();
      },
    });
  }, [
    registerEvents,
    reset,
    resetHoveredEdge,
    resetHoveredNode,
    select,
    selection,
    setHoveredEdge,
    setHoveredNode,
    toggle,
  ]);

  return null;
};
