import { TopologicalFilterDefinition } from "../types";
import { egoFilter } from "./ego";
import { kCoreFilter } from "./kCore";
import { largestConnectedComponentFilter } from "./largestConnectedComponentFilter";

export const topologicalFilters: (directed: boolean) => TopologicalFilterDefinition[] = (directed) => [
  largestConnectedComponentFilter,
  kCoreFilter,
  egoFilter(directed),
];
