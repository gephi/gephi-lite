import { SigmaGraph } from "@gephi/gephi-lite-sdk";
import { Attributes } from "graphology-types";
import { drawDiscNodeLabel } from "sigma/rendering";
import { Settings } from "sigma/settings";
import { NodeDisplayData, PartialButFor } from "sigma/types";

import { SelectionState } from "../selection/types";
import { SigmaState } from "./types";

/**
 * Returns an empty sigma state:
 */
export function getEmptySigmaState(): SigmaState {
  return {
    emphasizedNodes: null,
    emphasizedEdges: null,
    hoveredNode: null,
    hoveredEdge: null,
    highlightedNodes: null,
  };
}

/**
 * Returns the nodes currently emphasized: the ones explicitly listed in the sigma state, or else
 * the selected nodes (or the extremities of the selected edges), plus the hovered node and its
 * neighbors. As soon as some nodes are emphasized, they are the only ones to be labelled.
 */
export function getEmphasizedNodes({
  graph,
  selection,
  hoveredNode,
  emphasizedNodes,
}: {
  graph: SigmaGraph;
  selection: SelectionState;
  hoveredNode: string | null;
  emphasizedNodes: Set<string> | null;
}): Set<string> {
  if (emphasizedNodes) return emphasizedNodes;

  return new Set([
    ...(selection.type === "nodes" ? Array.from(selection.items) : []),
    // When edges are selected, emphasize their source and target nodes so that only
    // those node labels are shown (same treatment as selecting the nodes directly).
    ...(selection.type === "edges"
      ? Array.from(selection.items).flatMap((edge) => (graph.hasEdge(edge) ? [graph.source(edge), graph.target(edge)] : []))
      : []),
    ...(hoveredNode ? [hoveredNode, ...graph.neighbors(hoveredNode)] : []),
  ]);
}

export function drawDiscNodeHover<
  N extends Attributes = Attributes,
  E extends Attributes = Attributes,
  G extends Attributes = Attributes,
>(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
  settings: Settings<N, E, G>,
): void {
  const size = settings.labelSize,
    font = settings.labelFont,
    weight = settings.labelWeight;

  context.font = `${weight} ${size}px ${font}`;

  // Then we draw the label background
  context.fillStyle = (settings as Settings & { nodeHoverBackgroundColor?: string }).nodeHoverBackgroundColor || "#FFF";
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 8;
  context.shadowColor = "#000";

  const PADDING = 2;

  // TODO: remove the data.label !== "" once we decide what to do about https://github.com/jacomyal/sigma.js/issues/1527
  if (typeof data.label === "string" && data.label !== "") {
    const textWidth = context.measureText(data.label).width,
      boxWidth = Math.round(textWidth + 5),
      boxHeight = Math.round(size + 2 * PADDING),
      radius = Math.max(data.size, size / 2) + PADDING;

    const angleRadian = Math.asin(boxHeight / 2 / radius);
    const xDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)));

    context.beginPath();
    context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
    context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
    context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
    context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
    context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
    context.closePath();
    context.fill();
  } else {
    context.beginPath();
    context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // And finally we draw the label
  drawDiscNodeLabel(context, data, settings);
}
