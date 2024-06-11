import { simmelianStrength } from "graphology-metrics/edge";

import { FullGraph } from "../../graph/types";
import { Metric } from "../types";
import { quantitativeOnly } from "../utils";

export const simmelianStrengthMetric: Metric<"edges", ["simmelianStrength"]> = {
  id: "simmelianStrength",
  itemType: "edges",
  outputs: { simmelianStrength: quantitativeOnly },
  parameters: [],
  fn(_parameters: unknown, graph: FullGraph) {
    return { simmelianStrength: simmelianStrength(graph) };
  },
};
