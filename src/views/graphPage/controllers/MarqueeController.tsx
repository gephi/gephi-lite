import React from "react";
import { pick } from "lodash";
import { Coordinates } from "sigma/types";
import { FC, useCallback, useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useSelection, useSelectionActions, useSigmaActions } from "../../../core/context/dataContexts";

const MarqueeDisplay: FC<{ firstCorner: Coordinates; lastCorner: Coordinates }> = ({ firstCorner, lastCorner }) => {
  const x = Math.min(firstCorner.x, lastCorner.x);
  const y = Math.min(firstCorner.y, lastCorner.y);
  const width = Math.abs(firstCorner.x - lastCorner.x);
  const height = Math.abs(firstCorner.y - lastCorner.y);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width="100%" height="100%">
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          stroke="grey"
          fill="transparent"
          strokeWidth={2}
          strokeDasharray={6}
        />
      </svg>
    </div>
  );
};

export const MarqueeController: FC = () => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const [selectionState, setSelectionState] = useState<
    | { type: "idle" }
    | {
        type: "marquee";
        ctrlKeyDown: boolean;
        startCorner: Coordinates;
        mouseCorner: Coordinates;
        capturedNodes: string[];
      }
  >({ type: "idle" });

  const selection = useSelection();
  const { select } = useSelectionActions();
  const { setHighlightedNodes } = useSigmaActions();
  const cleanup = useCallback(() => {
    sigma.getCamera().enable();
    setSelectionState({ type: "idle" });
    setHighlightedNodes(null);
  }, [sigma, setHighlightedNodes]);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (selectionState.type === "idle") return;
      if (e.key === "Escape") cleanup();
      if (e.key === "Control") {
        setSelectionState((state) => ({ ...state, ctrlKeyDown: true }));
        setHighlightedNodes(new Set(selectionState.capturedNodes.concat(Array.from(selection.items))));
      }
    };
    const keyUpHandler = (e: KeyboardEvent) => {
      if (selectionState.type === "idle") return;
      if (e.key === "Control") {
        setSelectionState((state) => ({ ...state, ctrlKeyDown: false }));
        setHighlightedNodes(new Set(selectionState.capturedNodes));
      }
    };
    window.document.body.addEventListener("keydown", keyDownHandler);
    window.document.body.addEventListener("keyup", keyUpHandler);
    return () => {
      window.document.body.removeEventListener("keydown", keyDownHandler);
      window.document.body.removeEventListener("keyup", keyUpHandler);
    };
  }, [cleanup, selection, selectionState, setHighlightedNodes]);

  useEffect(() => {
    registerEvents({
      mousemovebody: (e) => {
        if (selectionState.type === "marquee") {
          const mousePosition = pick(e, "x", "y") as Coordinates;

          const graph = sigma.getGraph();
          const start = sigma.viewportToGraph(selectionState.startCorner);
          const end = sigma.viewportToGraph(mousePosition);

          const minX = Math.min(start.x, end.x);
          const minY = Math.min(start.y, end.y);
          const maxX = Math.max(start.x, end.x);
          const maxY = Math.max(start.y, end.y);

          const capturedNodes = graph.filterNodes((node, { x, y }) => {
            const size = sigma.getNodeDisplayData(node)!.size as number;
            return !(x + size < minX || x - size > maxX || y + size < minY || y - size > maxY);
          });

          setHighlightedNodes(
            new Set(
              capturedNodes.concat(
                selectionState.ctrlKeyDown && selection.type === "nodes" ? Array.from(selection.items) : [],
              ),
            ),
          );
          setSelectionState({
            ...selectionState,
            mouseCorner: mousePosition,
            capturedNodes,
          });
        }
      },
      doubleClickStage: (e) => {
        e.preventSigmaDefault();

        if (selectionState.type === "idle") {
          const mousePosition: Coordinates = pick(e.event, "x", "y");

          setSelectionState({
            type: "marquee",
            startCorner: mousePosition,
            mouseCorner: mousePosition,
            ctrlKeyDown: e.event.original.ctrlKey,
            capturedNodes: [],
          });
          sigma.getCamera().disable();
        }
      },
      clickStage: (e) => {
        if (selectionState.type !== "idle") {
          select({ items: new Set(selectionState.capturedNodes), type: "nodes", replace: !selectionState.ctrlKeyDown });
          cleanup();
        }
      },
    });
  }, [registerEvents, sigma, selectionState, selection, cleanup, setHighlightedNodes, select]);

  return selectionState.type === "marquee" ? (
    <MarqueeDisplay firstCorner={selectionState.startCorner} lastCorner={selectionState.mouseCorner} />
  ) : null;
};
