import {
  CoordinateGetter,
  DEFAULT_EDGE_SIZE,
  DEFAULT_NODE_SIZE,
  DatalessGraph,
  DynamicItemData,
  GraphDataset,
  SigmaGraph,
  StaticDynamicItemData,
  VisualGetters,
} from "@gephi/gephi-lite-sdk";
import Graph, { MultiGraph } from "graphology";

import {
  ContinuousLayoutSupervisorConstructor,
  ContinuousLayoutSupervisorInterface,
  LayoutMapping,
  LayoutState,
} from "./types";

export function getEmptyLayoutState(): LayoutState {
  return { quality: { enabled: false, showGrid: true }, type: "idle" };
}

export function getLocalStorageLayoutState(): LayoutState {
  const raw = localStorage.getItem("layout");
  const state = raw ? JSON.parse(raw) : null;
  return {
    ...getEmptyLayoutState(),
    ...state,
  };
}

/**
 * Builds a lightweight layout graph from dataset sources with only what layouts
 * need: x, y, size, fixed for nodes; weight for edges.
 */
export function buildLayoutGraph({
  dataset,
  filteredGraph,
  visualGetters,
  dynamicItemData,
  sigmaGraph,
  params,
  useSigmaPositions,
}: {
  dataset: GraphDataset;
  filteredGraph: DatalessGraph;
  visualGetters: VisualGetters;
  dynamicItemData: DynamicItemData;
  sigmaGraph: SigmaGraph;
  params: Record<string, unknown>;
  useSigmaPositions: boolean;
}): SigmaGraph {
  const layoutGraph = sigmaGraph.nullCopy();
  const reversePos = visualGetters.reverseNodePosition;
  const fixedAttr =
    "getNodeFixedAttribut" in params && params.getNodeFixedAttribut ? `${params.getNodeFixedAttribut}` : null;

  filteredGraph.forEachNode((node) => {
    let x: number, y: number;
    if (useSigmaPositions) {
      const sx = sigmaGraph.getNodeAttribute(node, "x");
      const sy = sigmaGraph.getNodeAttribute(node, "y");
      if (reversePos) {
        const p = reversePos({ x: sx, y: sy });
        x = p.x;
        y = p.y;
      } else {
        x = sx;
        y = sy;
      }
    } else {
      const pos = dataset.layout[node];
      x = pos?.x ?? 0;
      y = pos?.y ?? 0;
    }

    const data: StaticDynamicItemData = {
      static: dataset.nodeData[node] || {},
      dynamic: dynamicItemData.dynamicNodeData[node] || {},
    };
    const size = visualGetters.getNodeSize ? visualGetters.getNodeSize(data) : DEFAULT_NODE_SIZE;
    const fixed =
      sigmaGraph.getNodeAttribute(node, "dragging") === true ||
      (fixedAttr !== null && dataset.nodeData[node]?.[fixedAttr] === true);

    layoutGraph.addNode(node, { x, y, size, fixed });
  });

  filteredGraph.forEachEdge((edge, _attrs, source, target) => {
    const data: StaticDynamicItemData = {
      static: dataset.edgeData[edge] || {},
      dynamic: dynamicItemData.dynamicEdgeData[edge] || {},
    };
    const weight = visualGetters.getEdgeSize ? visualGetters.getEdgeSize(data) : DEFAULT_EDGE_SIZE;
    if (filteredGraph.isDirected(edge)) {
      layoutGraph.addDirectedEdgeWithKey(edge, source, target, { weight });
    } else {
      layoutGraph.addUndirectedEdgeWithKey(edge, source, target, { weight });
    }
  });

  return layoutGraph;
}

/**
 * Creates a layout supervisor that runs on a pre-built layout graph and syncs
 * positions back to the sigma graph on each tick.
 */
export function createLayoutSupervisor(
  SupervisorClass: ContinuousLayoutSupervisorConstructor,
  layoutGraph: MultiGraph,
  sigmaGraph: Graph,
  options: unknown,
  toSigma?: CoordinateGetter,
): { supervisor: ContinuousLayoutSupervisorInterface; getPositions: () => LayoutMapping } {
  const syncToSigma = () => {
    sigmaGraph.updateEachNodeAttributes((node, attrs) => {
      if (!layoutGraph.hasNode(node)) return attrs;
      const { x, y } = layoutGraph.getNodeAttributes(node);
      if (toSigma) {
        const pos = toSigma({ x, y });
        attrs.x = pos.x;
        attrs.y = pos.y;
      } else {
        attrs.x = x;
        attrs.y = y;
      }
      return attrs;
    });
  };
  layoutGraph.on("eachNodeAttributesUpdated", syncToSigma);

  const inner = new SupervisorClass(layoutGraph, { settings: options });

  return {
    supervisor: {
      start: () => inner.start(),
      stop: () => inner.stop(),
      kill: () => {
        inner.kill();
        layoutGraph.off("eachNodeAttributesUpdated", syncToSigma);
      },
      isRunning: () => inner.isRunning(),
    },
    getPositions: () => {
      const positions: LayoutMapping = {};
      layoutGraph.forEachNode((node, { x, y }) => {
        positions[node] = { x, y };
      });
      return positions;
    },
  };
}
