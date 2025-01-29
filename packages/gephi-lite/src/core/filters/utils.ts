import { FilteredGraph, stringifyWithSetsAndFunctions, toNumber, toString } from "@gephi/gephi-lite-sdk";
import { subgraph } from "graphology-operators";

import { computeAllDynamicAttributes } from "../graph/dynamicAttributes";
import { DatalessGraph, GraphDataset, SigmaGraph } from "../graph/types";
import { dataGraphToFullGraph } from "../graph/utils";
import { Scalar } from "../types";
import { buildTopologicalFiltersDefinitions } from "./topological";
import { FilterType, RangeFilterType, TermsFilterType } from "./types";

export { getEmptyFiltersState, parseFiltersState, serializeFiltersState } from "@gephi/gephi-lite-sdk";

/**
 * Actual filtering helpers:
 */
export function filterValue(
  value: Scalar,
  filter: Omit<RangeFilterType, "field" | "itemType"> | Omit<TermsFilterType, "field" | "itemType">,
): boolean {
  switch (filter.type) {
    case "range": {
      const number = toNumber(value);
      return (
        (typeof number === "number" &&
          inRangeIncluded(
            number,
            typeof filter.min === "number" ? filter.min : -Infinity,
            typeof filter.max === "number" ? filter.max : Infinity,
          )) ||
        (typeof number !== "number" && !!filter.keepMissingValues)
      );
    }
    case "terms": {
      if (!filter.terms) return true;
      const string = toString(value);
      return (
        (typeof string === "string" && filter.terms.has(string)) ||
        (typeof string !== "string" && !!filter.keepMissingValues)
      );
    }
  }
}

/**
 * check if value is in the range [min, max] min and max included
 * @param value
 * @param min
 * @param max
 */
export function inRangeIncluded(value: number, min: number | undefined, max: number | undefined) {
  return (!min || min <= value) && (!max || value <= max);
}

export function filterGraph<G extends DatalessGraph | SigmaGraph>(
  graph: G,
  dataset: GraphDataset,
  filter: FilterType,
): G {
  const { nodeData, edgeData } = dataset;

  if (filter.type === "topological") {
    const definition = buildTopologicalFiltersDefinitions(dataset.metadata.type !== "undirected").find(
      (f) => f.id === filter.topologicalFilterId,
    );
    if (!definition) throw new Error(`Topological filter definition "${filter.topologicalFilterId}" not found.`);
    return definition.filter(filter.parameters, graph) as G;
  }

  // Nodes:
  if (filter.itemType === "nodes") {
    let nodes: string[];
    if (filter.type === "script") {
      const fullGraph = dataGraphToFullGraph(dataset, graph);
      nodes = graph.filterNodes((nodeID) =>
        filter.script ? filter.script(nodeID, fullGraph.getNodeAttributes(nodeID), fullGraph) : true,
      );
    } else {
      nodes = graph.filterNodes((nodeID) => {
        const value = filter.field.dynamic
          ? computeAllDynamicAttributes("nodes", graph)[nodeID][filter.field.field]
          : nodeData[nodeID][filter.field.field];
        return filterValue(value, filter);
      });
    }
    return subgraph(graph, nodes) as G;
  }

  // Edges:
  else {
    let edges: string[] = [];
    if (filter.type === "script") {
      const fullGraph = dataGraphToFullGraph(dataset, graph);
      edges = graph.filterEdges((edgeID) =>
        filter.script ? filter.script(edgeID, fullGraph.getEdgeAttributes(edgeID), fullGraph) : true,
      );
    } else {
      edges = graph.filterEdges((edgeID) => {
        const value = filter.field.dynamic
          ? computeAllDynamicAttributes("edges", graph)[edgeID][filter.field.field]
          : edgeData[edgeID][filter.field.field];
        filterValue(value, filter);
      });
    }
    const res = graph.emptyCopy() as G;
    edges.forEach((id) => res.addEdgeWithKey(id, graph.source(id), graph.target(id), graph.getEdgeAttributes(id)));
    return res;
  }
}

export function getFilterFingerprint(filter: FilterType): string {
  return stringifyWithSetsAndFunctions(filter);
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
