import { TopologicalFilterType } from "../types";
import { egoFilter } from "./ego";
import { kCoreFilter } from "./kCore";
import { largestConnectedComponentFilter } from "./largestConnectedComponentFilter";

export const topologicalFilters: (directed: boolean) => TopologicalFilterType[] = (directed) => [
  largestConnectedComponentFilter,
  kCoreFilter,
  egoFilter(directed),
];
