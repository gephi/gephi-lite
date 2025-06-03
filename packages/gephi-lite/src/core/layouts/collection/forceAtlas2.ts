import { DataGraph } from "@gephi/gephi-lite-sdk";
import { ForceAtlas2LayoutParameters, ForceAtlas2Settings, inferSettings } from "graphology-layout-forceatlas2";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RAW_FA2_DEFAULT_SETTINGS from "graphology-layout-forceatlas2/defaults";
import FA2Layout from "graphology-layout-forceatlas2/worker";

import { WorkerLayout } from "../types";

const FA2_DEFAULT_SETTINGS = RAW_FA2_DEFAULT_SETTINGS as Required<ForceAtlas2Settings>;

export const ForceAtlas2Layout = {
  id: "fa2",
  type: "worker",
  supervisor: FA2Layout,
  buttons: [
    {
      id: "autoSettings",
      description: true,
      getSettings(_currentSettings, dataGraph: DataGraph) {
        const infer = inferSettings(dataGraph);
        return { ...FA2_DEFAULT_SETTINGS, ...infer };
      },
    },
  ],
  parameters: [
    {
      id: "adjustSizes",
      type: "boolean",
      description: true,
      defaultValue: FA2_DEFAULT_SETTINGS.adjustSizes,
    },
    {
      id: "barnesHutOptimize",
      type: "boolean",
      description: true,
      defaultValue: FA2_DEFAULT_SETTINGS.barnesHutOptimize,
    },
    {
      id: "barnesHutTheta",
      type: "number",
      description: true,
      defaultValue: FA2_DEFAULT_SETTINGS.barnesHutTheta,
      min: 0,
      step: 0.1,
    },
    {
      id: "edgeWeightInfluence",
      type: "number",
      description: true,
      defaultValue: FA2_DEFAULT_SETTINGS.edgeWeightInfluence,
      min: 0,
      step: 0.1,
    },
    {
      id: "gravity",
      type: "number",
      description: true,
      defaultValue: FA2_DEFAULT_SETTINGS.gravity,
      min: 0,
      step: 0.01,
      required: true,
    },
    { id: "linLogMode", type: "boolean", description: true, defaultValue: FA2_DEFAULT_SETTINGS.linLogMode },
    {
      id: "outboundAttractionDistribution",
      type: "boolean",
      defaultValue: FA2_DEFAULT_SETTINGS.outboundAttractionDistribution,
    },
    {
      id: "scalingRatio",
      type: "number",
      defaultValue: FA2_DEFAULT_SETTINGS.scalingRatio,
      min: 0,
      step: 1,
      required: true,
    },
    { id: "slowDown", type: "number", defaultValue: FA2_DEFAULT_SETTINGS.slowDown, min: 1, step: 1 },
    { id: "strongGravityMode", type: "boolean", defaultValue: FA2_DEFAULT_SETTINGS.strongGravityMode },
  ],
} as WorkerLayout<ForceAtlas2LayoutParameters>;
