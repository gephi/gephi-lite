import { disparityMetric } from "./edges/disparityMetric";
import { edgeScript } from "./edges/edgeScript";
import { simmelianStrengthMetric } from "./edges/simmelianStrength";
import { louvainEdgeAmbiguity } from "./mixed/louvainEdgeAmbiguity";
import { betweennessCentralityMetric } from "./nodes/betweennessCentralityMetric";
import { degreeMetric } from "./nodes/degreeMetric";
import { hitsMetric } from "./nodes/hitsMetric";
import { louvainMetric } from "./nodes/louvainMetric";
import { nodeScript } from "./nodes/nodeScript";
import { pageRankMetric } from "./nodes/pagerankMetric";
import { Metric } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const NODE_METRICS: Metric<{ nodes: any }>[] = [
  louvainMetric,
  pageRankMetric,
  betweennessCentralityMetric,
  degreeMetric,
  hitsMetric,
  nodeScript,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EDGE_METRICS: Metric<{ edges: any }>[] = [disparityMetric, simmelianStrengthMetric, edgeScript];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MIXED_METRICS: Metric<{ edges: any; nodes: any }>[] = [louvainEdgeAmbiguity];
