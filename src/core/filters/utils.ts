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
        (typeof number === "number" &&
          inRange(
            number,
            typeof filter.min === "number" ? filter.min : -Infinity,
            typeof filter.max === "number" ? filter.max : Infinity,
          )) ||
        (typeof number !== "number" && !!filter.keepMissingValues)
      );
    case "terms":
      if (!filter.terms) return true;
      const string = toString(value);
      return (
        (typeof string === "string" && filter.terms.has(string)) ||
        (typeof string !== "string" && !!filter.keepMissingValues)
      );
  }
}

export function filterGraph<G extends DatalessGraph | SigmaGraph>(
  graph: G,
  dataset: GraphDataset,
  filter: FilterType,
): G {
  const { nodeData, edgeData } = dataset;

  if (filter.type === "topological") {
    // TODO:
    return graph;
  }

  // Nodes:
  if (filter.itemType === "nodes") {
    let nodes: string[];
    if (filter.type === "script") {
      const fullGraph = dataGraphToFullGraph(dataset, graph);
      nodes = graph.filterNodes(
        (nodeID) => filter.script && filter.script(nodeID, fullGraph.getNodeAttributes(nodeID), fullGraph),
      );
    } else {
      nodes = graph.filterNodes((nodeID) => filterValue(nodeData[nodeID][filter.field], filter));
    }
    return subgraph(graph, nodes) as G;
  }

  // Edges:
  else {
    let edges: string[] = [];
    if (filter.type === "script") {
      const fullGraph = dataGraphToFullGraph(dataset, graph);
      edges = graph.filterEdges(
        (edgeID) => filter.script && filter.script(edgeID, fullGraph.getEdgeAttributes(edgeID), fullGraph),
      );
    } else {
      edges = graph.filterEdges((edgeID) => filterValue(edgeData[edgeID][filter.field], filter));
    }
    const res = graph.emptyCopy() as G;
    edges.forEach((id) => res.addEdgeWithKey(id, graph.source(id), graph.target(id), graph.getEdgeAttributes(id)));
    return res;
  }
}

export function getFilterFingerprint(filter: FilterType): string {
  return stringify(filter);
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
