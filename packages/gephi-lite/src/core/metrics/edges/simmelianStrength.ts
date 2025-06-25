import { simmelianStrength } from "graphology-metrics/edge";

import { FullGraph } from "../../graph/types";
import { Metric } from "../types";

export const simmelianStrengthMetric: Metric<{ edges: ["simmelianStrength"] }> = {
  id: "simmelianStrength",
  outputs: { edges: { simmelianStrength: { type: "number" } } },
  parameters: [],
  fn(_parameters: unknown, graph: FullGraph) {
    return { edges: { simmelianStrength: simmelianStrength(graph) } };
  },
};
