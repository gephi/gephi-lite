import { DEFAULT_NODE_SIZE } from "@gephi/gephi-lite-sdk";
import { clamp } from "lodash";
import { NodeDisplayData } from "sigma/types";

import { GephiLiteSigma } from "../graph/types";
import {
  LABEL_BASELINE_RATIO,
  LABEL_DESCENT_RATIO,
  VISIBLE_BAND_SELECTOR,
  VisibleBand,
  getVisibleBand,
} from "./utils";

/**
 * Node labels budget:
 * *******************
 *
 * Sigma picks by itself the labels it renders: it keeps the biggest node of each cell of a grid,
 * and skips the nodes rendered smaller than `labelRenderedSizeThreshold`. Both criteria dissolve
 * when zooming in: nodes grow in pixels, so more and more of them pass the size threshold, and
 * sigma's grid is built in a camera-independent space, so each of its cells is allowed
 * `labelDensity / cameraRatio²` labels — which clutters the screen at high zoom levels.
 *
 * We replace that here by a budget of labels per screen: before each frame, we keep the biggest
 * nodes of the visible area, spread over the viewport, and have sigma render only those.
 */

/**
 * Biggest label font size (in px) the vertical margin below is meant to accommodate. Above that,
 * the bottom of a label sitting right against the edge of the screen may be clipped.
 */
const MAX_EXPECTED_LABEL_SIZE = 24;
/**
 * Nodes closer than that to an edge of the screen are skipped, as their label would be cut off and
 * would waste a slot of the budget for something barely readable. The four sides are not
 * equivalent:
 *  - left: a label is drawn on the right of its node, so a node entering the screen shows its whole
 *    label right away, and nothing needs to be skipped;
 *  - right: the label runs off screen, and the margin buys back part of its width;
 *  - top and bottom: only the height of the label matters, which is a fraction of its font size
 *    (see LABEL_*_RATIO), hence a much smaller margin than on the right.
 */
const VIEWPORT_INNER_MARGINS = {
  left: 0,
  right: 25,
  vertical: Math.ceil((LABEL_BASELINE_RATIO + LABEL_DESCENT_RATIO) * MAX_EXPECTED_LABEL_SIZE),
};
/** How many times the grid may be refined when the visible nodes are too clustered to fill the budget: */
const MAX_GRID_PASSES = 3;

interface LabelCandidate {
  key: string;
  size: number;
  degree: number;
  /** Was that label already displayed on the previous frame? */
  kept: boolean;
}

/**
 * Ranks two candidates for a same area of the screen: the biggest node first, then the one that is
 * already labelled (which limits flickering while the camera moves), then the most connected one,
 * and finally by key, so that the selection remains deterministic.
 */
function compareLabelCandidates(a: LabelCandidate, b: LabelCandidate): number {
  if (a.size !== b.size) return b.size - a.size;
  if (a.kept !== b.kept) return a.kept ? -1 : 1;
  if (a.degree !== b.degree) return b.degree - a.degree;
  return a.key < b.key ? -1 : 1;
}

/**
 * Returns the nodes whose label should be displayed: the biggest ones among those well inside the
 * screen, and spread over the viewport rather than piled up on its densest area.
 *
 * The viewport is split in a grid of roughly `budget` square cells, and only the best candidate of
 * each cell is kept, which is what spreads the labels: when many nodes share the same size (the
 * common case when sizes are uniform), they are then de facto distributed over the visible area.
 * Nodes are binned in graph coordinates, where the viewport is an axis-aligned rectangle (Gephi
 * Lite always keeps the camera angle at 0), which avoids projecting every node of the graph.
 */
export function selectNodeLabels(
  sigma: GephiLiteSigma,
  band: VisibleBand,
  budget: number,
  previous: Pick<Set<string>, "has">,
): Set<string> {
  if (budget <= 0) return new Set();

  const graph = sigma.getGraph();
  const { left, top, width, height } = band;
  // Margins are kept a fraction of the band, so that they stay sane on a small screen:
  const marginLeft = Math.min(VIEWPORT_INNER_MARGINS.left, width / 4);
  const marginRight = Math.min(VIEWPORT_INNER_MARGINS.right, width / 4);
  const marginVertical = Math.min(VIEWPORT_INNER_MARGINS.vertical, height / 4);
  const topLeft = sigma.viewportToGraph({ x: left + marginLeft, y: top + marginVertical });
  const bottomRight = sigma.viewportToGraph({
    x: left + width - marginRight,
    y: top + height - marginVertical,
  });
  const xMin = Math.min(topLeft.x, bottomRight.x);
  const yMin = Math.min(topLeft.y, bottomRight.y);
  const spanX = Math.abs(bottomRight.x - topLeft.x) || 1;
  const spanY = Math.abs(bottomRight.y - topLeft.y) || 1;

  // Cells are as square as possible on screen, hence a grid shaped like the viewport:
  const baseColumns = Math.max(1, Math.round(Math.sqrt((budget * width) / (height || 1))));
  const baseRows = Math.max(1, Math.ceil(budget / baseColumns));

  const pickBestPerCell = (columns: number, rows: number): LabelCandidate[] => {
    const cells = new Map<number, LabelCandidate>();

    graph.forEachNode((node, { x, y, label, size, hidden }) => {
      if (hidden || !label) return;
      if (x < xMin || x > xMin + spanX || y < yMin || y > yMin + spanY) return;

      const column = clamp(Math.floor(((x - xMin) / spanX) * columns), 0, columns - 1);
      const row = clamp(Math.floor(((y - yMin) / spanY) * rows), 0, rows - 1);
      const index = row * columns + column;

      const nodeSize = size ?? DEFAULT_NODE_SIZE;
      const current = cells.get(index);
      // Skipping the most common case early keeps that loop cheap on big graphs:
      if (current && current.size > nodeSize) return;

      const candidate: LabelCandidate = {
        key: node,
        size: nodeSize,
        degree: graph.degree(node),
        kept: previous.has(node),
      };
      if (!current || compareLabelCandidates(candidate, current) < 0) cells.set(index, candidate);
    });

    return Array.from(cells.values());
  };

  // A grid of `budget` cells only yields `budget` labels if the visible nodes are spread over the
  // whole viewport: when they are clustered (or when most cells are empty), the grid is refined so
  // that the budget is used anyway.
  let selection: LabelCandidate[] = [];
  for (let pass = 0; pass < MAX_GRID_PASSES; pass++) {
    const subdivision = 2 ** pass;
    const candidates = pickBestPerCell(baseColumns * subdivision, baseRows * subdivision);
    if (candidates.length <= selection.length) break;
    selection = candidates;
    if (selection.length >= budget) break;
  }

  if (selection.length > budget) {
    selection.sort(compareLabelCandidates);
    selection = selection.slice(0, budget);
  }

  return new Set(selection.map(({ key }) => key));
}

/**
 * Makes sigma render the labels selected by `selectNodeLabels`, and returns a cleanup function.
 *
 * Sigma has no public API to choose which labels get rendered: a label is rendered when its node is
 * listed in sigma's internal "forced labels" index *and* flagged as forced in its display data. As
 * `labelRenderedSizeThreshold` is set to Infinity (see SettingsController), no other label passes
 * sigma's own selection, so those forced labels are exactly the displayed ones — we refresh our
 * share of them before each frame.
 *
 * When `enabled` is false (i.e. when some nodes are emphasized, on hover or selection), we display
 * none: the labels of the emphasized nodes, forced through the appearance reducer, are then the
 * only ones left.
 */
export function applyNodeLabelsBudget(
  sigma: GephiLiteSigma,
  { labelsCount, enabled }: { labelsCount: number; enabled: boolean },
): () => void {
  // Both indices are replaced by brand new objects on every indexation, hence the lookups below:
  const internals = sigma as unknown as {
    nodesWithForcedLabels?: Set<string>;
    nodeDataCache?: Record<string, NodeDisplayData>;
  };
  /**
   * The nodes we are labelling, mapped to the display data we altered: once sigma has rebuilt its
   * cache, that entry is stale, our flag is already gone, and the appearance's own forced labels
   * (which the reducer restores on indexation) must not be touched.
   */
  let ownLabels = new Map<string, NodeDisplayData>();

  /** Stops labelling the nodes we were labelling, but for those to keep: */
  const release = (keep?: Set<string>) => {
    const { nodesWithForcedLabels: forcedLabels, nodeDataCache } = internals;
    ownLabels.forEach((data, node) => {
      if (keep?.has(node) || nodeDataCache?.[node] !== data) return;
      data.forceLabel = false;
      forcedLabels?.delete(node);
    });
  };

  const update = () => {
    const { nodesWithForcedLabels: forcedLabels, nodeDataCache } = internals;
    if (!forcedLabels || !nodeDataCache) return;

    const band = getVisibleBand(sigma);
    // The configured count is displayed as such on every device: a phone shows as many labels as a
    // desktop screen, only more tightly packed, which is what one expects when setting a number.
    const labels = selectNodeLabels(sigma, band, enabled ? labelsCount : 0, ownLabels);
    release(labels);

    const applied = new Map<string, NodeDisplayData>();
    labels.forEach((node) => {
      const data = nodeDataCache[node];
      if (!data) return;
      data.forceLabel = true;
      forcedLabels.add(node);
      applied.set(node, data);
    });
    ownLabels = applied;
  };

  sigma.on("beforeRender", update);
  sigma.scheduleRender();

  // Opening or closing a panel does not resize the canvas, only the band left visible, so sigma
  // would not redraw by itself and labels would stay hidden behind that panel:
  const bandElement = document.querySelector(VISIBLE_BAND_SELECTOR);
  const bandObserver = bandElement ? new ResizeObserver(() => sigma.scheduleRender()) : null;
  if (bandElement) bandObserver?.observe(bandElement);

  return () => {
    sigma.off("beforeRender", update);
    bandObserver?.disconnect();
    release();
    ownLabels = new Map();
  };
}
