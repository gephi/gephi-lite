import { DatalessGraph } from "@gephi/gephi-lite-sdk";

import { TopologicalFilterDefinition } from "../types";
import { buildEgoFilterDefinition } from "./ego";
import { buildKCoreFilterDefinition } from "./kCore";
import { buildLargestConnectedComponentFilterDefinition } from "./largestConnectedComponentFilter";

export const buildTopologicalFiltersDefinitions: (graph: DatalessGraph) => TopologicalFilterDefinition[] = (graph) => [
  buildKCoreFilterDefinition(),
  buildLargestConnectedComponentFilterDefinition(),
  buildEgoFilterDefinition(graph.type === "directed"),
];
