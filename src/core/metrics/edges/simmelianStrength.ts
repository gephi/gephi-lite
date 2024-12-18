import { simmelianStrength } from "graphology-metrics/edge";

import { FullGraph } from "../../graph/types";
import { Metric } from "../types";
import { quantitativeOnly } from "../utils";

export const simmelianStrengthMetric: Metric<{ edges: ["simmelianStrength"] }> = {
  id: "simmelianStrength",
  outputs: { edges: { simmelianStrength: quantitativeOnly } },
  parameters: [],
  fn(_parameters: unknown, graph: FullGraph) {
    return { edges: { simmelianStrength: simmelianStrength(graph) } };
  },
};
