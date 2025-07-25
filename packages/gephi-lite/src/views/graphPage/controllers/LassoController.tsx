import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { pick } from "lodash";
import React, { FC, useCallback, useEffect, useRef } from "react";
import { Coordinates, SigmaEventPayload } from "sigma/types";

import { useSelection, useSelectionActions, useSigmaActions } from "../../../core/context/dataContexts";
import { bindUpHandler } from "../../../utils/events";

/**
 * This helper uses the Ray casting algorithm:
 * https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm
 */
const isPointInPolygon = (point: Coordinates, polygon: Coordinates[]): boolean => {
  let inside = false;
  const { x, y } = point;

  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];

    const edgeCrossesRay = current.y > y !== next.y > y;

    if (edgeCrossesRay) {
      const intersectionX = ((next.x - current.x) * (y - current.y)) / (next.y - current.y) + current.x;
      if (x < intersectionX) {
        inside = !inside;
      }
    }
  }

  return inside;
};

const distancePointToLineSegment = (point: Coordinates, lineStart: Coordinates, lineEnd: Coordinates): number => {
  const { x: px, y: py } = point;
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // If line segment has zero length, return distance to point
  if (dx === 0 && dy === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

  // Calculate parameter t for closest point on line segment
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  // Calculate closest point on line segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Return distance from point to closest point
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
};

const doCollide = (center: Coordinates, radius: number, polygon: Coordinates[]): boolean => {
  if (polygon.length < 3) return false; // Need at least 3 points for a polygon

  // Check if circle center is inside polygon
  if (isPointInPolygon(center, polygon)) return true;

  // Check if circle intersects any edge of the polygon
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];

    const distanceToEdge = distancePointToLineSegment(center, current, next);

    if (distanceToEdge <= radius) return true;
  }

  return false;
};

const LassoDisplay: FC<{ points: Coordinates[] }> = ({ points }) => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width="100%" height="100%">
        <path
          d={points.map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ")}
          stroke="grey"
          fill="transparent"
          strokeWidth={2}
          strokeDasharray={6}
        />
        {points.length > 1 && (
          <path
            d={`M ${points.at(0)!.x} ${points.at(0)!.y} L ${points.at(-1)!.x} ${points.at(-1)!.y}`}
            stroke="grey"
            fill="transparent"
            strokeWidth={1}
            strokeDasharray={6}
          />
        )}
      </svg>
    </div>
  );
};

export const LassoController: FC = () => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const selectionRef = useRef<
    | { type: "idle"; spaceKeyDown: boolean }
    | {
        type: "lasso";
        ctrlKeyDown: boolean;
        points: Coordinates[];
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
            type: "lasso",
            points: [mousePosition],
            ctrlKeyDown: e.event.original.ctrlKey,
            capturedNodes: [],
          };
          sigma.getCamera().disable();
        }
      }
    };
    registerEvents({
      moveBody: (e) => {
        if (selectionRef.current.type === "lasso") {
          const mousePosition = pick(e.event, "x", "y") as Coordinates;

          const graph = sigma.getGraph();
          const polygon = selectionRef.current.points.map(({ x, y }) => sigma.viewportToGraph({ x, y }));
          const capturedNodes = graph.filterNodes((node, { x, y }) => {
            const size = sigma.getNodeDisplayData(node)!.size as number;
            return doCollide({ x, y }, size, polygon);
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
            points: selectionRef.current.points.concat(mousePosition),
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
        if (e.key === "Control") {
          selectionRef.current = { ...selectionRef.current, ctrlKeyDown: false };
          setEmphasizedNodes(new Set(selectionRef.current.capturedNodes));
        }
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

  return selectionRef.current.type === "lasso" ? <LassoDisplay points={selectionRef.current.points} /> : null;
};
