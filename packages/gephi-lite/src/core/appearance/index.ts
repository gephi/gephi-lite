import { getEmptyAppearanceState, serializeAppearanceState } from "@gephi/gephi-lite-sdk";
import { Producer, atom, producerToAction } from "@ouestware/atoms";

import { ItemType } from "../types";
import {
  AppearanceState,
  BooleanAppearance,
  Color,
  LabelEllipsis,
  LabelSize,
  ShadingColor,
  Size,
  StringAttr,
  ZIndexAttr,
} from "./types";
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_LAYOUT_GRID_COLOR } from "./utils";

const resetState: Producer<AppearanceState, []> = () => {
  return () => getEmptyAppearanceState();
};

const setFullState: Producer<AppearanceState, [AppearanceState]> = (newState) => {
  return () => newState;
};
const mergeState: Producer<AppearanceState, [Partial<AppearanceState>]> = (newPartialState) => {
  return (state) => ({ ...state, ...newPartialState });
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
const setShadingColorAppearance: Producer<AppearanceState, [ItemType, ShadingColor | undefined]> = (
  itemType,
  shadingColor,
) => {
  return (state) => ({
    ...state,
    [itemType === "nodes" ? "nodesShadingColor" : "edgesShadingColor"]: shadingColor,
  });
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

const setEdgesZIndexAppearance: Producer<AppearanceState, [ZIndexAttr]> = (zIndex) => {
  return (state) => ({ ...state, edgesZIndex: zIndex });
};

const setNodesLabelEllipsisAppearance: Producer<AppearanceState, [LabelEllipsis]> = (labelEllipsis) => {
  return (state) => ({ ...state, nodesLabelEllipsis: labelEllipsis });
};

const setEdgesLabelEllipsisAppearance: Producer<AppearanceState, [LabelEllipsis]> = (labelEllipsis) => {
  return (state) => ({ ...state, edgesLabelEllipsis: labelEllipsis });
};

/**
 * Public API:
 * ***********
 */
export const appearanceAtom = atom<AppearanceState>(getEmptyAppearanceState());

export const appearanceActions = {
  resetState: producerToAction(resetState, appearanceAtom),
  setFullState: producerToAction(setFullState, appearanceAtom),
  mergeState: producerToAction(mergeState, appearanceAtom),
  setShowEdges: producerToAction(setShowEdges, appearanceAtom),
  setSizeAppearance: producerToAction(setSizeAppearance, appearanceAtom),
  setColorAppearance: producerToAction(setColorAppearance, appearanceAtom),
  setShadingColorAppearance: producerToAction(setShadingColorAppearance, appearanceAtom),
  setBackgroundColorAppearance: producerToAction(setBackgroundColorAppearance, appearanceAtom),
  setLayoutGridColorAppearance: producerToAction(setLayoutGridColorAppearance, appearanceAtom),
  setLabelAppearance: producerToAction(setLabelAppearance, appearanceAtom),
  setLabelSizeAppearance: producerToAction(setLabelSizeAppearance, appearanceAtom),
  setNodeImagesAppearance: producerToAction(setNodeImagesAppearance, appearanceAtom),
  setEdgesZIndexAppearance: producerToAction(setEdgesZIndexAppearance, appearanceAtom),
  setNodesLabelEllipsisAppearance: producerToAction(setNodesLabelEllipsisAppearance, appearanceAtom),
  setEdgesLabelEllipsisAppearance: producerToAction(setEdgesLabelEllipsisAppearance, appearanceAtom),
} as const;

/**
 * Bindings:
 * *********
 */
appearanceAtom.bind((appearanceState) => {
  sessionStorage.setItem("appearance", serializeAppearanceState(appearanceState));
});
