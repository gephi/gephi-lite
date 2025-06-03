import ForceSupervisor, { ForceLayoutSupervisorParameters } from "graphology-layout-force/worker";

import { WorkerLayout } from "../types";

export const ForceLayout = {
  id: "force",
  type: "worker",
  supervisor: ForceSupervisor,
  parameters: [
    { id: "attraction", type: "number", description: true, defaultValue: 0.0005, min: 0, step: 0.0001 },
    { id: "repulsion", type: "number", description: true, defaultValue: 0.1, min: 0, step: 0.1 },
    { id: "gravity", type: "number", description: true, defaultValue: 0.0001, min: 0, step: 0.0001 },
    { id: "inertia", type: "number", description: true, defaultValue: 0.6, min: 0, max: 1, step: 0.1 },
    { id: "maxMove", type: "number", description: true, defaultValue: 200 },
  ],
} as WorkerLayout<ForceLayoutSupervisorParameters>;
