import { AppearanceState } from "./types";

export const DEFAULT_NODE_COLOR = "#666666";
export const DEFAULT_EDGE_COLOR = "#999999";
export const DEFAULT_NODE_SIZE = 10;
export const DEFAULT_EDGE_SIZE = 3;

export function getEmptyAppearanceState(): AppearanceState {
  return {
    nodesSize: {
      type: "fixed",
      value: DEFAULT_NODE_SIZE,
    },
    edgesSize: {
      type: "fixed",
      value: DEFAULT_EDGE_SIZE,
    },
    nodesColor: {
      type: "fixed",
      value: DEFAULT_NODE_COLOR,
    },
    edgesColor: {
      type: "fixed",
      value: DEFAULT_EDGE_COLOR,
    },
  };
}
