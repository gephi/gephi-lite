import { AppearanceState } from "./types";

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
  };
}
