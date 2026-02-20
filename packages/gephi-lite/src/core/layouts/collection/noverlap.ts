import NoverlapLayoutSUpervisor, { NoverlapLayoutSupervisorParameters } from "graphology-layout-noverlap/worker";

import { ContinuousLayout } from "../types";

export const NoverlapLayout = {
  id: "noverlap",
  type: "continuous",
  description: true,
  supervisor: NoverlapLayoutSUpervisor,
  parameters: [
    { id: "gridSize", type: "number", description: true, defaultValue: 20 },
    { id: "margin", type: "number", description: true, defaultValue: 5 },
    { id: "expansion", type: "number", description: true, defaultValue: 1.1, step: 0.1 },
    { id: "ratio", type: "number", description: true, defaultValue: 1 },
    { id: "speed", type: "number", description: true, defaultValue: 3 },
  ],
} as ContinuousLayout<NoverlapLayoutSupervisorParameters>;
