import { atom } from "../utils/atoms";
import { AppearanceState, Color, Label, LabelSize, Size } from "./types";
import { getEmptyAppearanceState, serializeAppearanceState } from "./utils";
import { Producer, producerToAction } from "../utils/producers";
import { ItemType } from "../types";

const resetState: Producer<AppearanceState, []> = () => {
  return () => getEmptyAppearanceState();
};

const setShowEdges: Producer<AppearanceState, [boolean]> = (showEdges) => {
  return (state) => ({ ...state, showEdges });
};

const setSizeAppearance: Producer<AppearanceState, [ItemType, Size]> = (itemType, size) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesSize" : "edgesSize"]: size });
};

const setColorAppearance: Producer<AppearanceState, [ItemType, Color]> = (itemType, color) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesColor" : "edgesColor"]: color });
};

const setLabelAppearance: Producer<AppearanceState, [ItemType, Label]> = (itemType, label) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesLabel" : "edgesLabel"]: label });
};

const setLabelSizeAppearance: Producer<AppearanceState, [ItemType, LabelSize]> = (itemType, labelSize) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesLabelSize" : "edgesLabelSize"]: labelSize });
};

/**
 * Public API:
 * ***********
 */
export const appearanceAtom = atom<AppearanceState>(getEmptyAppearanceState());

export const appearanceActions = {
  resetState: producerToAction(resetState, appearanceAtom),
  setShowEdges: producerToAction(setShowEdges, appearanceAtom),
  setSizeAppearance: producerToAction(setSizeAppearance, appearanceAtom),
  setColorAppearance: producerToAction(setColorAppearance, appearanceAtom),
  setLabelAppearance: producerToAction(setLabelAppearance, appearanceAtom),
  setLabelSizeAppearance: producerToAction(setLabelSizeAppearance, appearanceAtom),
} as const;

/**
 * Bindings:
 * *********
 */
appearanceAtom.bind((appearanceState) => {
  sessionStorage.setItem("appearance", serializeAppearanceState(appearanceState));
});
