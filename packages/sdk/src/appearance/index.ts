import { parseWithSetsAndFunctions, stringifyWithSetsAndFunctions } from "../utils";
import { AppearanceState } from "./types";

export * from "./types";

export const DEFAULT_NODE_COLOR = "#999999";
export const DEFAULT_EDGE_COLOR = "#cccccc";
export const DEFAULT_NODE_SIZE = 20;
export const DEFAULT_EDGE_SIZE = 6;
export const DEFAULT_NODE_LABEL_SIZE = 14;
export const DEFAULT_EDGE_LABEL_SIZE = 14;
export const DEFAULT_BACKGROUND_COLOR = "#FFFFFF00";
export const DEFAULT_LAYOUT_GRID_COLOR = "#666666";
export const DEFAULT_REFINEMENT_COLOR = "#ffffff";

export function getEmptyAppearanceState(): AppearanceState {
  return {
    showEdges: {
      itemType: "edges",
      value: true,
    },
    nodesSize: {
      itemType: "nodes",
      type: "data",
    },
    edgesSize: {
      itemType: "edges",
      type: "data",
    },
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    layoutGridColor: DEFAULT_LAYOUT_GRID_COLOR,
    nodesColor: {
      itemType: "nodes",
      type: "data",
    },
    edgesColor: {
      itemType: "edges",
      type: "data",
    },
    nodesLabel: {
      itemType: "nodes",
      type: "data",
    },
    edgesLabel: {
      itemType: "edges",
      type: "data",
    },
    nodesLabelSize: {
      itemType: "nodes",
      type: "fixed",
      value: DEFAULT_NODE_LABEL_SIZE,
      zoomCorrelation: 0,
      density: 1,
    },
    edgesLabelSize: {
      itemType: "edges",
      type: "fixed",
      value: DEFAULT_EDGE_LABEL_SIZE,
      zoomCorrelation: 0,
      density: 1,
    },
    nodesLabelEllipsis: {
      itemType: "nodes",
      type: "ellipsis",
      enabled: false,
      maxLength: 25,
    },
    edgesLabelEllipsis: {
      itemType: "edges",
      type: "ellipsis",
      enabled: false,
      maxLength: 25,
    },
    nodesImage: {
      itemType: "nodes",
      type: "none",
    },
    edgesZIndex: {
      itemType: "edges",
      type: "none",
    },
  };
}

/**
 * Appearance lifecycle helpers (state serialization / deserialization):
 */
export function serializeAppearanceState(appearance: AppearanceState): string {
  return stringifyWithSetsAndFunctions(appearance);
}
export function parseAppearanceState(rawAppearance: string): AppearanceState | null {
  try {
    // TODO:
    // Validate the actual data
    return { ...getEmptyAppearanceState(), ...parseWithSetsAndFunctions(rawAppearance) };
  } catch (e) {
    return null;
  }
}
