import { atom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/reducers";
import { LayoutsState, Layout } from "./types";
import { getEmptyLayoutState } from "./utils";

/**
 * List of available layouts
 */
export const LAYOUTS: Array<Layout> = [
  {
    id: "random",
    isWorker: false,
    description: true,
    parameters: [],
  },
  {
    id: "circular",
    isWorker: false,
    description: true,
    parameters: [],
  },
  {
    id: "circlePack",
    isWorker: false,
    description: true,
    parameters: [],
  },
  {
    id: "fa2",
    isWorker: true,
    parameters: [
      {
        id: "adjustSizes",
        type: "boolean",
        description: true,
        defaultValue: false,
      },
      {
        id: "barnesHutOptimize",
        type: "boolean",
        description: true,
        defaultValue: false,
      },
      { id: "barnesHutTheta", type: "number", description: true, defaultValue: 0.5 },
      {
        id: "edgeWeightInfluence",
        type: "number",
        description: true,
        defaultValue: 1,
      },
      { id: "gravity", type: "number", description: true, defaultValue: 1 },
      { id: "linLogMode", type: "boolean", description: true, defaultValue: false },
      { id: "outboundAttractionDistribution", type: "boolean", defaultValue: false },
      { id: "scalingRatio", type: "number", defaultValue: 1 },
      { id: "slowDown", type: "number", defaultValue: 1 },
      { id: "strongGravityMode", type: "boolean", defaultValue: false },
    ],
  },
  {
    id: "force",
    isWorker: true,
    parameters: [
      { id: "attraction", type: "number", description: true, defaultValue: 0.0005 },
      { id: "repulsion", type: "number", description: true, defaultValue: 0.1 },
      { id: "gravity", type: "number", description: true, defaultValue: 0.0001 },
      { id: "inertia", type: "number", description: true, defaultValue: 0.6 },
      { id: "maxMove", type: "number", description: true, defaultValue: 200 },
    ],
  },
  {
    id: "noverlap",
    isWorker: true,
    description: true,
    parameters: [
      { id: "gridSize", type: "number", description: true, defaultValue: 0.0005 },
      { id: "margin", type: "number", description: true, defaultValue: 5 },
      { id: "expansion", type: "number", description: true, defaultValue: 1.1 },
      { id: "ratio", type: "number", description: true, defaultValue: 1 },
      { id: "speed", type: "number", description: true, defaultValue: 3 },
    ],
  },
];

/**
 * Producers:
 * **********
 */
export const selectLayout: Producer<LayoutsState, [string]> = (layoutId) => {
  return (state) => ({
    ...state,
    selected: layoutId,
  });
};

export const startLayout: Producer<LayoutsState, [string]> = (layoutId) => {
  // TODO: check if id exist in layout list
  return (state) => ({
    ...state,
    isRunning: true,
  });
};

export const stopLayout: Producer<LayoutsState, [string]> = (layoutId) => {
  // TODO: check if id exist in layout list
  return (state) => ({
    ...state,
    isRunning: false,
  });
};

export const setParameterLayout: Producer<LayoutsState, [string]> = (layoutId) => {
  // TODO: check if id exist in layout list
  return (state) => ({
    ...state,
    selected: layoutId,
  });
};

export const reinitParameterLayout: Producer<LayoutsState, [string]> = (layoutId) => {
  // TODO: check if id exist in layout list
  return (state) => ({
    ...state,
    selected: layoutId,
  });
};

/**
 * Public API:
 * ***********
 */
export const layoutsAtom = atom<LayoutsState>(getEmptyLayoutState());

export const layoutsActions = {
  selectLayout: producerToAction(selectLayout, layoutsAtom),
  startLayout: producerToAction(startLayout, layoutsAtom),
  stopLayout: producerToAction(stopLayout, layoutsAtom),
  setParameterLayout: producerToAction(setParameterLayout, layoutsAtom),
  reinitParameterLayout: producerToAction(reinitParameterLayout, layoutsAtom),
} as const;
