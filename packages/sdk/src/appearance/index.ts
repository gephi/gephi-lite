import { gephiLiteParse, gephiLiteStringify } from "../utils";
import { type AppearanceState } from "./types";

export * from "./types";

export const DEFAULT_NODE_COLOR = "#999999";
export const DEFAULT_EDGE_COLOR = "#cccccc";
export const DEFAULT_NODE_SIZE = 20;
export const DEFAULT_EDGE_SIZE = 6;
export const DEFAULT_NODE_LABEL_SIZE = 14;
export const DEFAULT_EDGE_LABEL_SIZE = 14;
export const DEFAULT_BACKGROUND_COLOR = "#FFFFFF00";
export const DEFAULT_LAYOUT_GRID_COLOR = "#666666";
export const DEFAULT_SHADING_COLOR = "#ffffff";

export function getEmptyAppearanceState(): AppearanceState {
  return {
    showEdges: {
      value: true,
    },
    nodesSize: {
      type: "fixed",
      value: DEFAULT_NODE_SIZE,
    },
    edgesSize: {
      type: "fixed",
      value: DEFAULT_EDGE_SIZE,
    },
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    layoutGridColor: DEFAULT_LAYOUT_GRID_COLOR,
    nodesColor: {
      type: "fixed",
      value: DEFAULT_NODE_COLOR,
    },
    edgesColor: {
      type: "fixed",
      value: DEFAULT_EDGE_COLOR,
    },
    nodesLabel: {
      type: "none",
    },
    edgesLabel: {
      type: "none",
    },
    nodesLabelSize: {
      type: "fixed",
      value: DEFAULT_NODE_LABEL_SIZE,
      zoomCorrelation: 0,
      density: 1,
    },
    edgesLabelSize: {
      type: "fixed",
      value: DEFAULT_EDGE_LABEL_SIZE,
      zoomCorrelation: 0,
      density: 1,
    },
    nodesLabelEllipsis: {
      type: "ellipsis",
      enabled: false,
      maxLength: 25,
    },
    edgesLabelEllipsis: {
      type: "ellipsis",
      enabled: false,
      maxLength: 25,
    },
    nodesImage: {
      type: "none",
    },
    edgesZIndex: {
      type: "none",
    },
  };
}

/**
 * Appearance lifecycle helpers (state serialization / deserialization):
 */
export function serializeAppearanceState(appearance: AppearanceState): string {
  return gephiLiteStringify(appearance);
}
export function parseAppearanceState(rawAppearance: string): AppearanceState | null {
  try {
    // TODO:
    // Validate the actual data
    return { ...getEmptyAppearanceState(), ...gephiLiteParse(rawAppearance) };
  } catch (_e) {
    return null;
  }
}
