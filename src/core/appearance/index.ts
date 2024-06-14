import { ItemType } from "../types";
import { atom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/producers";
import { AppearanceState, BooleanAppearance, Color, LabelSize, Size, StringAttr } from "./types";
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_LAYOUT_GRID_COLOR,
  getEmptyAppearanceState,
  serializeAppearanceState,
} from "./utils";

const resetState: Producer<AppearanceState, []> = () => {
  return () => getEmptyAppearanceState();
};

const setShowEdges: Producer<AppearanceState, [BooleanAppearance]> = (showEdges) => {
  return (state) => ({ ...state, showEdges });
};

const setSizeAppearance: Producer<AppearanceState, [ItemType, Size]> = (itemType, size) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesSize" : "edgesSize"]: size });
};

const setBackgroundColorAppearance: Producer<AppearanceState, [string | undefined]> = (color) => {
  return (state) => ({ ...state, backgroundColor: color || DEFAULT_BACKGROUND_COLOR });
};
const setLayoutGridColorAppearance: Producer<AppearanceState, [string | undefined]> = (color) => {
  return (state) => ({ ...state, layoutGridColor: color || DEFAULT_LAYOUT_GRID_COLOR });
};
const setColorAppearance: Producer<AppearanceState, [ItemType, Color]> = (itemType, color) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesColor" : "edgesColor"]: color });
};

const setLabelAppearance: Producer<AppearanceState, [ItemType, StringAttr]> = (itemType, label) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesLabel" : "edgesLabel"]: label });
};

const setLabelSizeAppearance: Producer<AppearanceState, [ItemType, LabelSize]> = (itemType, labelSize) => {
  return (state) => ({ ...state, [itemType === "nodes" ? "nodesLabelSize" : "edgesLabelSize"]: labelSize });
};

const setNodeImagesAppearance: Producer<AppearanceState, [StringAttr]> = (nodesImage) => {
  return (state) => ({ ...state, nodesImage });
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
  setBackgroundColorAppearance: producerToAction(setBackgroundColorAppearance, appearanceAtom),
  setLayoutGridColorAppearance: producerToAction(setLayoutGridColorAppearance, appearanceAtom),
  setLabelAppearance: producerToAction(setLabelAppearance, appearanceAtom),
  setLabelSizeAppearance: producerToAction(setLabelSizeAppearance, appearanceAtom),
  setNodeImagesAppearance: producerToAction(setNodeImagesAppearance, appearanceAtom),
} as const;

/**
 * Bindings:
 * *********
 */
appearanceAtom.bind((appearanceState) => {
  sessionStorage.setItem("appearance", serializeAppearanceState(appearanceState));
});
