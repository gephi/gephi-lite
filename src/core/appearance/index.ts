import { atom } from "../utils/atoms";
import { AppearanceState, Color, Size } from "./types";
import { getEmptyAppearanceState } from "./utils";
import { Producer, producerToAction } from "../utils/reducers";
import { ItemType } from "../types";

const setSizeAppearance: Producer<AppearanceState, [ItemType, Size]> = (itemType, size) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesSize" : "edgesSize"]: size });
};

const setColorAppearance: Producer<AppearanceState, [ItemType, Color]> = (itemType, color) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesColor" : "edgesColor"]: color });
};

/**
 * Public API:
 * ***********
 */
export const appearanceAtom = atom<AppearanceState>(getEmptyAppearanceState());

export const appearanceActions = {
  setSizeAppearance: producerToAction(setSizeAppearance, appearanceAtom),
  setColorAppearance: producerToAction(setColorAppearance, appearanceAtom),
} as const;
