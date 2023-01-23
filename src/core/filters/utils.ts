import { inRange } from "lodash";
import { subgraph } from "graphology-operators";

import { Filter, FiltersState, RangeFilter, TermsFilter } from "./types";
import { toNumber, toString } from "../utils/casting";
import { DatalessGraph, GraphDataset, SigmaGraph } from "../graph/types";
import { dataGraphToSigmaGraph } from "../graph/utils";

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
 * Actual filtering helpers:
 */
function filterValue(value: any, filter: RangeFilter | TermsFilter): boolean {
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
      const string = toString(value);
      return typeof string === "string" && filter.terms.has(string);
  }
}
function filterNode(id: string, dataset: GraphDataset, filter: Filter): boolean {
  switch (filter.type) {
    case "range":
    case "terms":
      return filterValue(dataset.nodeData[id][filter.field], filter);
    case "script":
      return filter.script(id);
  }
  return true;
}
function filterEdge(id: string, source: string, target: string, dataset: GraphDataset, filter: Filter): boolean {
  switch (filter.type) {
    case "range":
    case "terms":
      return filterValue(dataset.edgeData[id][filter.field], filter);
    case "script":
      return filter.script(id);
  }
  return true;
}

export function filterGraph<G extends DatalessGraph | SigmaGraph>(graph: G, dataset: GraphDataset, filter: Filter): G {
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

export function datasetToFilteredSigmaGraph(dataset: GraphDataset, filters: Filter[]): SigmaGraph {
  return dataGraphToSigmaGraph(
    dataset,
    filters.reduce((graph, filter) => filterGraph(graph, dataset, filter), dataset.fullGraph),
  );
}
