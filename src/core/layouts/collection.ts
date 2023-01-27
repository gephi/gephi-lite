import random, { RandomLayoutOptions } from "graphology-layout/random";
import circular, { CircularLayoutOptions } from "graphology-layout/circular";
import circlepack, { CirclePackLayoutOptions } from "graphology-layout/circlepack";
import { ForceAtlas2LayoutParameters } from "graphology-layout-forceatlas2";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import ForceSupervisor, { ForceLayoutSupervisorParameters } from "graphology-layout-force/worker";
import NoverlapLayout, { NoverlapLayoutSupervisorParameters } from "graphology-layout-noverlap/worker";
import { Layout, SyncLayout, WorkerLayout } from "./types";

/**
 * List of available layouts
 */
export const LAYOUTS: Array<Layout> = [
  {
    id: "random",
    type: "sync",
    description: true,
    parameters: [
      {
        id: "center",
        type: "number",
        description: true,
        defaultValue: 0.5,
      },
      {
        id: "scale",
        type: "number",
        description: true,
        defaultValue: 1,
      },
    ],
    run: random,
  } as SyncLayout<RandomLayoutOptions>,
  {
    id: "circular",
    type: "sync",
    description: true,
    parameters: [
      {
        id: "center",
        type: "number",
        description: true,
        defaultValue: 0.5,
      },
      {
        id: "scale",
        type: "number",
        description: true,
        defaultValue: 1,
      },
    ],
    run: circular,
  } as SyncLayout<CircularLayoutOptions>,
  {
    id: "circlePack",
    type: "sync",
    description: true,
    parameters: [
      {
        id: "center",
        type: "number",
        description: true,
        defaultValue: 0.5,
      },
      {
        id: "scale",
        type: "number",
        description: true,
        defaultValue: 1,
      },
    ],
    run: circlepack,
  } as SyncLayout<CirclePackLayoutOptions>,
  {
    id: "fa2",
    type: "worker",
    supervisor: FA2Layout,
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
  } as WorkerLayout<ForceAtlas2LayoutParameters>,
  {
    id: "force",
    type: "worker",
    supervisor: ForceSupervisor,
    parameters: [
      { id: "attraction", type: "number", description: true, defaultValue: 0.0005 },
      { id: "repulsion", type: "number", description: true, defaultValue: 0.1 },
      { id: "gravity", type: "number", description: true, defaultValue: 0.0001 },
      { id: "inertia", type: "number", description: true, defaultValue: 0.6, min: 0, max: 1 },
      { id: "maxMove", type: "number", description: true, defaultValue: 200 },
    ],
  } as WorkerLayout<ForceLayoutSupervisorParameters>,
  {
    id: "noverlap",
    type: "worker",
    description: true,
    supervisor: NoverlapLayout,
    parameters: [
      { id: "gridSize", type: "number", description: true, defaultValue: 20 },
      { id: "margin", type: "number", description: true, defaultValue: 5 },
      { id: "expansion", type: "number", description: true, defaultValue: 1.1 },
      { id: "ratio", type: "number", description: true, defaultValue: 1 },
      { id: "speed", type: "number", description: true, defaultValue: 3 },
    ],
  } as WorkerLayout<NoverlapLayoutSupervisorParameters>,
];
