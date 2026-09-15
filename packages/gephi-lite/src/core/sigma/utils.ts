import { Attributes } from "graphology-types";
import { Sigma } from "sigma";
import { drawDiscNodeLabel } from "sigma/rendering";
import { Settings } from "sigma/settings";
import { NodeDisplayData, PartialButFor } from "sigma/types";

import { MERCATOR_WORLD } from "../../utils/geo";
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

/**
 * Sets MERCATOR_WORLD bbox and fits the camera to a Mercator extent.
 */
export function fitCameraToMercatorExtent(
  sigma: Sigma,
  extent: { minX: number; minY: number; maxX: number; maxY: number },
) {
  sigma.setCustomBBox(MERCATOR_WORLD);
  sigma.getCamera().setState({ angle: 0, x: 0.5, y: 0.5, ratio: 1 });

  if (extent.minX > extent.maxX || extent.minY > extent.maxY) return;

  const centerX = (extent.minX + extent.maxX) / 2;
  const centerY = (extent.minY + extent.maxY) / 2;
  const extentW = extent.maxX - extent.minX;
  const extentH = extent.maxY - extent.minY;

  // Visible range at ratio=1 with a 1×1 bbox: sigma fits the square to the
  // viewport preserving aspect ratio, so the longer axis spans W/H or H/W.
  const { width, height } = sigma.getDimensions();
  const visibleW = width >= height ? width / height : 1;
  const visibleH = width >= height ? 1 : height / width;

  const margin = 1.1;
  const ratio = Math.max((extentW * margin) / visibleW, (extentH * margin) / visibleH, 0.01);
  sigma.getCamera().setState({ angle: 0, x: centerX, y: centerY, ratio });
}

/**
 * Computes the Mercator extent of all nodes by projecting dataset positions
 * through the given coordinate getter.
 */
export function computeMercatorExtent(
  layout: Record<string, { x: number; y: number }>,
  getNodePosition: (pos: { x: number; y: number }) => { x: number; y: number },
) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const node in layout) {
    const pos = getNodePosition(layout[node]);
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  }
  return { minX, minY, maxX, maxY };
}
