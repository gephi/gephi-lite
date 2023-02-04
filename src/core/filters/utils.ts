import { inRange } from "lodash";
import { subgraph } from "graphology-operators";

import { FilterType, FiltersState, RangeFilterType, TermsFilterType, FilteredGraph } from "./types";
import { toNumber, toString } from "../utils/casting";
import { DatalessGraph, GraphDataset, SigmaGraph } from "../graph/types";
import { dataGraphToFullGraph } from "../graph/utils";
import { parse, stringify } from "../utils/json";

/**
 * Returns an empty filters state:
 */
export function getEmptyFiltersState(): FiltersState {
  return {
    past: [],
    future: [],
  };
}

/**
 * Filters lifecycle helpers (state serialization / deserialization):
 */
export function serializeFiltersState(filters: FiltersState): string {
  return stringify(filters);
}
export function parseFiltersState(rawFilters: string): FiltersState | null {
  try {
    // TODO:
    // Validate the actual data
    return parse(rawFilters);
  } catch (e) {
    return null;
  }
}

/**
 * Actual filtering helpers:
 */
function filterValue(value: any, filter: RangeFilterType | TermsFilterType): boolean {
  switch (filter.type) {
    case "range":
      const number = toNumber(value);
      return (
        typeof number === "number" &&
        inRange(
          number,
          typeof filter.min === "number" ? filter.min : -Infinity,
          typeof filter.max === "number" ? filter.max : Infinity,
        )
      );
    case "terms":
      if (!filter.terms) return true;
      const string = toString(value);
      return typeof string === "string" && filter.terms.has(string);
  }
}
function filterNode(id: string, dataset: GraphDataset, filter: FilterType): boolean {
  switch (filter.type) {
    case "range":
    case "terms":
      return filterValue(dataset.nodeData[id][filter.field], filter);
    case "script":
      if (filter.script) return filter.script(id);
  }
  return true;
}
function filterEdge(id: string, source: string, target: string, dataset: GraphDataset, filter: FilterType): boolean {
  switch (filter.type) {
    case "range":
    case "terms":
      return filterValue(dataset.edgeData[id][filter.field], filter);
    case "script":
      if (filter.script) return filter.script(id);
  }
  return true;
}

export function filterGraph<G extends DatalessGraph | SigmaGraph>(
  graph: G,
  dataset: GraphDataset,
  filter: FilterType,
): G {
  if (filter.type === "topological") {
    // TODO:
    return graph;
  }

  if (filter.itemType === "nodes") {
    return subgraph(
      graph,
      graph.filterNodes((nodeID) => filterNode(nodeID, dataset, filter)),
    ) as G;
  } else {
    const res = graph.emptyCopy() as G;
    graph.forEachEdge((id, attributes, source, target) => {
      if (filterEdge(id, source, target, dataset, filter)) res.addEdgeWithKey(id, source, target, attributes);
    });
    return res;
  }
}

export function getFilterFingerprint(filter: FilterType): string {
  return stringify(filter);
}

export function datasetToFilteredSigmaGraph(dataset: GraphDataset, filters: FilterType[]): SigmaGraph {
  return dataGraphToFullGraph(
    dataset,
    filters.reduce((graph, filter) => filterGraph(graph, dataset, filter), dataset.fullGraph),
  );
}

export function applyFilters(dataset: GraphDataset, filters: FilterType[], cache: FilteredGraph[]): FilteredGraph[] {
  const steps: FilteredGraph[] = [];

  filters.reduce((graph, filter, i) => {
    const filterFingerprint = getFilterFingerprint(filter);
    const cacheStep = cache[i];
    let subgraph: DatalessGraph;

    if (cacheStep?.filterFingerprint === filterFingerprint) {
      subgraph = cacheStep.graph;
    } else {
      cache = [];
      subgraph = filterGraph(graph, dataset, filter);
    }

    steps.push({ filterFingerprint, graph: subgraph });
    return subgraph;
  }, dataset.fullGraph);

  return steps;
}
