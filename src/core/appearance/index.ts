import { atom } from "../utils/atoms";
import { AppearanceState, Color, Size } from "./types";
import { getEmptyAppearanceState } from "./utils";
import { Producer } from "../utils/reducers";
import { ItemType } from "../types";

const setSizeAppearance: Producer<AppearanceState, [ItemType, Size]> = (itemType, size) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesSize" : "edgesSize"]: size });
};

const setColorAppearance: Producer<AppearanceState, [ItemType, Color]> = (itemType, color) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesColor" : "edgesColor"]: color });
};

export const appearanceProducers = {
  setSizeAppearance,
  setColorAppearance,
} as const;

/**
 * Public API:
 * ***********
 */
export const appearanceAtom = atom<AppearanceState>(getEmptyAppearanceState());
