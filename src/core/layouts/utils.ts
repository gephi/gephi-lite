import { LayoutsState } from "./types";

/**
 * Returns an empty layout state:
 */
export function getEmptyLayoutState(): LayoutsState {
  return {
    selected: "fa2",
    isRunning: false,
    layoutsParamaters: {},
  };
}
