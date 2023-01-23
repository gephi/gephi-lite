import { atom } from "../utils/atoms";
import { AppearanceState, Size } from "./types";
import { getEmptyAppearanceState } from "./utils";
import { Producer } from "../utils/reducers";
import { ItemType } from "../types";

const setSizeAppearance: Producer<AppearanceState, [ItemType, Size]> = (itemType, size) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesSize" : "edgesSize"]: size });
};

export const appearanceProducers = {
  setSizeAppearance,
} as const;

/**
 * Public API:
 * ***********
 */
export const appearanceAtom = atom<AppearanceState>(getEmptyAppearanceState());
