import { TopologicalFilterDefinition } from "../types";
import { buildEgoFilterDefinition } from "./ego";
import { buildKCoreFilterDefinition } from "./kCore";
import { buildLargestConnectedComponentFilterDefinition } from "./largestConnectedComponentFilter";

export const buildTopologicalFiltersDefinitions: (directed: boolean) => TopologicalFilterDefinition[] = (directed) => [
  buildKCoreFilterDefinition(),
  buildLargestConnectedComponentFilterDefinition(),
  buildEgoFilterDefinition(directed),
];
