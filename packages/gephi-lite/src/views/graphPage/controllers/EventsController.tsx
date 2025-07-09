import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { fitViewportToNodes } from "@sigma/utils";
import { mapValues, pick } from "lodash";
import { FC, useEffect, useRef } from "react";
import { Coordinates, MouseCoords } from "sigma/types";

import {
  useGraphDatasetActions,
  useSelection,
  useSelectionActions,
  useSigmaActions,
} from "../../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../../core/context/eventsContext";
import { GephiLiteSigma } from "../../../core/graph/types";
import { LayoutMapping } from "../../../core/layouts/types";
import { bindUpHandler } from "../../../utils/events";

const DRAG_EVENTS_TOLERANCE = 3;

export const EventsController: FC = () => {
  const sigma: GephiLiteSigma = useSigma();
  const registerEvents = useRegisterEvents();
  const { emitter: globalEmitter } = useEventsContext();

  const selection = useSelection();
  const { setNodePositions } = useGraphDatasetActions();
  const { select, toggle, emptySelection } = useSelectionActions();
  const { setHoveredNode, resetHoveredNode, setHoveredEdge, resetHoveredEdge } = useSigmaActions();

  const dragStateRef = useRef<
    | { type: "idle" }
    | {
        type: "dragging" | "downing";
        initialMousePosition: Coordinates;
        initialNodesPosition: Record<string, Coordinates>;
      }
  >({ type: "idle" });
  const dragEventsCountRef = useRef(0);

  /**
   * Handle interaction events:
   */
  useEffect(() => {
    registerEvents({
      enterEdge({ edge }) {
        if (dragStateRef.current.type !== "idle") return;
        setHoveredEdge(edge);
      },
      leaveEdge() {
        if (dragStateRef.current.type !== "idle") return;
        resetHoveredEdge();
      },
      enterNode({ node }) {
        if (dragStateRef.current.type !== "idle") return;
        setHoveredNode(node);
      },
      leaveNode() {
        if (dragStateRef.current.type !== "idle") return;
        resetHoveredNode();
      },
      clickNode({ node, event }) {
        if (dragEventsCountRef.current >= DRAG_EVENTS_TOLERANCE) return;

        if (event.original.ctrlKey) {
          toggle({
            type: "nodes",
            item: node,
          });
        } else if (selection.type === "nodes" && selection.items.has(node) && selection.items.size === 1) {
          emptySelection();
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
          emptySelection();
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

        const initialNodesPosition: LayoutMapping = {};
        nodes.forEach((node) => {
          // I think the fixed  attribute is a failed tryout to solve the drag during layout issue https://github.com/gephi/gephi-lite/issues/138
          graph.setNodeAttribute(node, "fixed", true);
          const { x, y } = graph.getNodeAttributes(node);
          initialNodesPosition[node] = { x, y };
        });

        dragEventsCountRef.current = 0;
        dragStateRef.current = {
          type: "downing",
          initialNodesPosition,
          initialMousePosition: { x, y },
        };
      },
      clickStage(e) {
        // Reset the selection when clicking on the stage
        // except when ctrl is pressed to add node in selection
        // with the marquee selector
        if (!e.event.original.ctrlKey) emptySelection();
      },
      moveBody: (e) => {
        const dragState = dragStateRef.current;
        if (dragState.type === "downing" || dragState.type === "dragging") {
          if (dragState.type === "downing") dragStateRef.current = { ...dragState, type: "dragging" };
          dragEventsCountRef.current++;
          const graph = sigma.getGraph();

          // Set new positions for nodes:
          const newPosition = sigma.viewportToGraph(e.event);
          const delta = {
            x: newPosition.x - dragState.initialMousePosition.x,
            y: newPosition.y - dragState.initialMousePosition.y,
          };

          for (const node in dragState.initialNodesPosition) {
            const initialPosition = dragState.initialNodesPosition[node];
            graph.setNodeAttribute(node, "x", initialPosition.x + delta.x);
            graph.setNodeAttribute(node, "y", initialPosition.y + delta.y);
          }
          globalEmitter.emit(EVENTS.nodesDragged);

          // Prevent sigma to move camera:
          e.preventSigmaDefault();
          e.event.original.preventDefault();
        }
      },
    });

    const upHandler = () => {
      const dragState = dragStateRef.current;
      if (dragState.type === "downing" || dragState.type === "dragging") {
        const graph = sigma.getGraph();
        if (dragState.type === "dragging") {
          // Save new positions in graph dataset:
          const positions = mapValues(dragState.initialNodesPosition, (_initialPosition, id) =>
            pick(graph.getNodeAttributes(id), ["x", "y"]),
          );
          setNodePositions(positions);

          resetHoveredNode();
          resetHoveredEdge();
        }
        // I think the fixed  attribute is a failed tryout to solve the drag during layout issue https://github.com/gephi/gephi-lite/issues/138
        graph.forEachNode((node) => graph.setNodeAttribute(node, "fixed", false));
        dragStateRef.current = { type: "idle" };
      }
    };

    const unbind = bindUpHandler(upHandler);
    return () => {
      unbind();
    };
  }, [
    registerEvents,
    emptySelection,
    resetHoveredEdge,
    resetHoveredNode,
    select,
    selection,
    setHoveredEdge,
    setHoveredNode,
    sigma,
    toggle,
    setNodePositions,
    globalEmitter,
  ]);

  // DOM events not handled by sigma:
  useEffect(() => {
    const leaveHandle = () => {
      if (dragStateRef.current.type !== "idle") return;

      resetHoveredNode();
      resetHoveredEdge();
    };

    const container = sigma.getContainer();
    container.addEventListener("mouseleave", leaveHandle);
    return () => {
      container.removeEventListener("mouseleave", leaveHandle);
    };
  }, [resetHoveredEdge, resetHoveredNode, sigma]);

  // Custom Gephi Lite events:
  useEffect(() => {
    // Handle focus events:
    const focusNodesHandle = async ({ nodes }: { nodes: Set<string> }) => {
      await fitViewportToNodes(sigma, Array.from(nodes), {
        animate: true,
      });
    };

    globalEmitter.on(EVENTS.focusNodes, focusNodesHandle);
    return () => {
      globalEmitter.off(EVENTS.focusNodes, focusNodesHandle);
    };
  }, [globalEmitter, sigma]);

  // Broadcast "sigmaMounted" event on mount:
  useEffect(() => {
    globalEmitter.emit(EVENTS.sigmaMounted);
  }, [globalEmitter]);

  return null;
};
