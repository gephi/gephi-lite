import { mapValues, pick } from "lodash";
import { FC, useEffect, useState } from "react";
import { Coordinates, MouseCoords } from "sigma/types";
import { useRegisterEvents, useSigma } from "@react-sigma/core";

import {
  useGraphDatasetActions,
  useSelection,
  useSelectionActions,
  useSigmaActions,
} from "../../../core/context/dataContexts";

const DRAG_EVENTS_TOLERANCE = 3;

export const EventsController: FC = () => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();

  const selection = useSelection();
  const { setNodePositions } = useGraphDatasetActions();
  const { select, toggle, reset } = useSelectionActions();
  const { setHoveredNode, resetHoveredNode, setHoveredEdge, resetHoveredEdge } = useSigmaActions();

  const [dragEventsCount, setDragEventsCount] = useState(0);
  const [dragState, setDragState] = useState<
    | { type: "idle" }
    | {
        type: "dragging";
        initialMousePosition: Coordinates;
        initialNodesPosition: Record<string, Coordinates>;
      }
  >({ type: "idle" });

  useEffect(() => {
    registerEvents({
      enterEdge({ edge }) {
        if (dragState.type !== "idle") return;
        setHoveredEdge(edge);
      },
      leaveEdge() {
        if (dragState.type !== "idle") return;
        resetHoveredEdge();
      },
      enterNode({ node }) {
        if (dragState.type !== "idle") return;
        setHoveredNode(node);
      },
      leaveNode() {
        if (dragState.type !== "idle") return;
        resetHoveredNode();
      },
      clickNode({ node, event }) {
        if (dragEventsCount >= DRAG_EVENTS_TOLERANCE) return;

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
      downNode: ({ node, event }) => {
        const graph = sigma.getGraph();
        const nodes = selection.type === "nodes" && selection.items.has(node) ? Array.from(selection.items) : [node];
        const { x, y } = sigma.viewportToGraph(event);

        setDragEventsCount(0);
        setDragState({
          type: "dragging",
          initialMousePosition: { x, y },
          initialNodesPosition: nodes.reduce(
            (iter, n) => ({ ...iter, [n]: pick(graph.getNodeAttributes(n), ["x", "y"]) }),
            {},
          ),
        });
      },
      mouseup: () => {
        if (dragState.type === "dragging") {
          // Save new positions in graph dataset:
          const graph = sigma.getGraph();
          const positions = mapValues(dragState.initialNodesPosition, (_initialPosition, id) =>
            pick(graph.getNodeAttributes(id), ["x", "y"]),
          );
          setNodePositions(positions);

          setDragState({ type: "idle" });

          resetHoveredNode();
          resetHoveredEdge();
        }
      },
      mousemovebody: (e) => {
        if (dragState.type === "dragging") {
          setDragEventsCount((n) => n + 1);
          const graph = sigma.getGraph();

          // Set new positions for nodes:
          const newPosition = sigma.viewportToGraph(e);
          const delta = {
            x: newPosition.x - dragState.initialMousePosition.x,
            y: newPosition.y - dragState.initialMousePosition.y,
          };

          for (const node in dragState.initialNodesPosition) {
            const initialPosition = dragState.initialNodesPosition[node];
            graph.setNodeAttribute(node, "x", initialPosition.x + delta.x);
            graph.setNodeAttribute(node, "y", initialPosition.y + delta.y);
          }

          // Prevent sigma to move camera:
          e.preventSigmaDefault();
          e.original.preventDefault();
        }
      },
    });
  }, [
    dragState,
    dragEventsCount,
    registerEvents,
    reset,
    resetHoveredEdge,
    resetHoveredNode,
    select,
    selection,
    setHoveredEdge,
    setHoveredNode,
    sigma,
    toggle,
  ]);

  // DOM events not handled by sigma:
  useEffect(() => {
    const leaveHandle = () => {
      if (dragState.type !== "idle") return;

      resetHoveredNode();
      resetHoveredEdge();
    };

    const container = sigma.getContainer();
    container.addEventListener("mouseleave", leaveHandle);
    return () => {
      container.removeEventListener("mouseleave", leaveHandle);
    };
  }, [dragState.type, resetHoveredEdge, resetHoveredNode, sigma]);

  return null;
};
