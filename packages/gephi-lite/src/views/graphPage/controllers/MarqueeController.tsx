import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { pick } from "lodash";
import React, { FC, useCallback, useEffect, useRef } from "react";
import { Coordinates, SigmaEventPayload } from "sigma/types";

import { useSelection, useSelectionActions, useSigmaActions } from "../../../core/context/dataContexts";
import { bindUpHandler } from "../../../utils/events";

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
  const selectionRef = useRef<
    | { type: "idle"; spaceKeyDown: boolean }
    | {
        type: "marquee";
        ctrlKeyDown: boolean;
        startCorner: Coordinates;
        mouseCorner: Coordinates;
        capturedNodes: string[];
      }
  >({ type: "idle", spaceKeyDown: false });

  const selection = useSelection();
  const { select } = useSelectionActions();
  const { setEmphasizedNodes, setCursor } = useSigmaActions();
  const cleanup = useCallback(() => {
    sigma.getCamera().enable();
    selectionRef.current = { type: "idle", spaceKeyDown: false };
    setEmphasizedNodes(null);
  }, [sigma, setEmphasizedNodes]);

  useEffect(() => {
    const downHandler = (e: SigmaEventPayload) => {
      if (selectionRef.current.type === "idle") {
        if (selectionRef.current.spaceKeyDown) {
          setCursor("grabbing");
        } else {
          const mousePosition: Coordinates = pick(e.event, "x", "y");

          selectionRef.current = {
            type: "marquee",
            startCorner: mousePosition,
            mouseCorner: mousePosition,
            ctrlKeyDown: e.event.original.ctrlKey,
            capturedNodes: [],
          };
          sigma.getCamera().disable();
        }
      }
    };
    registerEvents({
      moveBody: (e) => {
        if (selectionRef.current.type === "marquee") {
          const mousePosition = pick(e.event, "x", "y") as Coordinates;

          const graph = sigma.getGraph();
          const start = sigma.viewportToGraph(selectionRef.current.startCorner);
          const end = sigma.viewportToGraph(mousePosition);

          const minX = Math.min(start.x, end.x);
          const minY = Math.min(start.y, end.y);
          const maxX = Math.max(start.x, end.x);
          const maxY = Math.max(start.y, end.y);

          const capturedNodes = graph.filterNodes((node, { x, y }) => {
            const size = sigma.getNodeDisplayData(node)!.size as number;
            return !(x + size < minX || x - size > maxX || y + size < minY || y - size > maxY);
          });

          setEmphasizedNodes(
            new Set(
              capturedNodes.concat(
                selectionRef.current.ctrlKeyDown && selection.type === "nodes" ? Array.from(selection.items) : [],
              ),
            ),
          );
          selectionRef.current = {
            ...selectionRef.current,
            mouseCorner: mousePosition,
            capturedNodes,
          };
        }
      },
      downStage: downHandler,
      downEdge: downHandler,
    });

    const keyDownHandler = (e: KeyboardEvent) => {
      if (selectionRef.current.type === "idle") {
        if (e.code === "Space" && !e.repeat) {
          selectionRef.current = { ...selectionRef.current, spaceKeyDown: true };
          setCursor("grab");
        }
      } else {
        if (e.key === "Control") {
          selectionRef.current = { ...selectionRef.current, ctrlKeyDown: true };
          setEmphasizedNodes(new Set(selectionRef.current.capturedNodes.concat(Array.from(selection.items))));
        }
      }
    };
    const keyUpHandler = (e: KeyboardEvent) => {
      if (selectionRef.current.type === "idle") {
        if (e.code === "Space") {
          selectionRef.current = { ...selectionRef.current, spaceKeyDown: false };
          setCursor(undefined);
        }
      } else {
        selectionRef.current = { ...selectionRef.current, ctrlKeyDown: false };
        setEmphasizedNodes(new Set(selectionRef.current.capturedNodes));
      }
    };
    const upHandler = () => {
      if (selectionRef.current.type === "idle") {
        setCursor(selectionRef.current.spaceKeyDown ? "grab" : undefined);
      } else {
        select({
          items: new Set(selectionRef.current.capturedNodes),
          type: "nodes",
          replace: !selectionRef.current.ctrlKeyDown,
        });
        cleanup();
      }
    };

    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
    const unbind = bindUpHandler(upHandler);
    return () => {
      window.removeEventListener("keydown", keyDownHandler);
      window.removeEventListener("keyup", keyUpHandler);
      unbind();
    };
  }, [registerEvents, sigma, selection, cleanup, setEmphasizedNodes, select, setCursor]);

  return selectionRef.current.type === "marquee" ? (
    <MarqueeDisplay firstCorner={selectionRef.current.startCorner} lastCorner={selectionRef.current.mouseCorner} />
  ) : null;
};
