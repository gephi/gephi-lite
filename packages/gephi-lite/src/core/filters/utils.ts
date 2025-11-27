import { FilteredGraph, MissingValueFilterType, Scalar, gephiLiteStringify } from "@gephi/gephi-lite-sdk";
import { subgraph } from "graphology-operators";
import { isNil, isNumber } from "lodash";
import { DateTime } from "luxon";

import {
  computeAllDynamicAttributes,
  getScalarFromStaticDynamicData,
  mergeStaticDynamicData,
} from "../graph/dynamicAttributes";
import { castScalarToModelValue, castScalarToQuantifiableValue } from "../graph/fieldModel";
import { DatalessGraph, GraphDataset, SigmaGraph } from "../graph/types";
import { dataGraphToFullGraph } from "../graph/utils";
import { FilterType, RangeFilterType, TermsFilterType, TopologicalFilterDefinition } from "./types";

export { getEmptyFiltersState, parseFiltersState, serializeFiltersState } from "@gephi/gephi-lite-sdk";

/**
 * Actual filtering helpers:
 */
export function filterValue(
  scalar: Scalar,
  filter:
    | Omit<RangeFilterType, "itemType">
    | Omit<TermsFilterType, "itemType">
    | Omit<MissingValueFilterType, "itemType">
    | Omit<import("./types").TimelineFilterType, "itemType">,
): boolean {
  // missingValues
  if (scalar === undefined || scalar === null) {
    // we keep missing values if user specifically asked for them

    // dedicated filter
    if (filter.type === "missingValue") return true;

    // terms filter on category/boolean has a special explicit choice for including missing values
    // we keep missing value if no choice has been made yet (empty filter) or if the special case has been selected
    if (filter.type === "terms" && ["category", "boolean"].includes(filter.field.type))
      return filter.terms === undefined || filter.terms.size === 0 || filter.terms?.has(null);

    // for all other filter we have a dedicated special settings for that
    return filter.keepMissingValues === true;
  }

  switch (filter.type) {
    case "range": {
      const valueAsNumber = castScalarToQuantifiableValue(scalar, filter.field);
      return (
        (typeof valueAsNumber === "number" &&
          inRangeIncluded(
            valueAsNumber,
            typeof filter.min === "number" ? filter.min : -Infinity,
            typeof filter.max === "number" ? filter.max : Infinity,
          )) ||
        (typeof valueAsNumber !== "number" && !!filter.keepMissingValues)
      );
    }
    case "timeline": {
      const value = castScalarToModelValue(scalar, filter.field);
      // Timeline filters work with DateTime objects
      if (value instanceof DateTime) {
        const timestamp = value.toMillis();
        return inRangeIncluded(
          timestamp,
          typeof filter.minDate === "number" ? filter.minDate : -Infinity,
          typeof filter.maxDate === "number" ? filter.maxDate : Infinity,
        );
      }
      // If value is not a DateTime, check if we should keep missing values
      return !!filter.keepMissingValues;
    }
    case "terms": {
      const value = castScalarToModelValue(scalar, filter.field);
      if (filter.terms === undefined) return true;
      else {
        if (value instanceof DateTime || isNumber(value)) {
          return !!filter.keepMissingValues;
        }
        const stringsOrBoolean = (Array.isArray(value) ? value : !isNil(value) ? [value] : []).filter(
          (v): v is string => ["string", "boolean"].includes(typeof v),
        );
        return stringsOrBoolean.some((stringOrBoolean) => !filter.terms || filter.terms.has(stringOrBoolean));
      }
    }
    case "missingValue":
      return false;
    // TODO: search filter
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
  topologicalFiltersDefinitions: TopologicalFilterDefinition[],
): G {
  const { nodeData, edgeData } = dataset;

  if (filter.type === "topological") {
    const definition = topologicalFiltersDefinitions.find((f) => f.id === filter.topologicalFilterId);
    if (!definition) throw new Error(`Topological filter definition "${filter.topologicalFilterId}" not found.`);
    return definition.filter(filter.parameters, graph) as G;
  }

  // Nodes:
  if (filter.itemType === "nodes") {
    let nodes: null | string[] = null;
    if (filter.type === "script") {
      const fullGraph = dataGraphToFullGraph(dataset, graph);

      nodes = graph.filterNodes((nodeID) =>
        filter.script ? filter.script(nodeID, fullGraph.getNodeAttributes(nodeID), fullGraph) : true,
      );
    } else {
      if (filter.field) {
        const dynamicNodeData = filter.field.dynamic ? computeAllDynamicAttributes("nodes", graph) : {};
        const staticDynamicNodeData = mergeStaticDynamicData(nodeData, dynamicNodeData);
        const field = filter.field;
        nodes = graph.filterNodes((nodeID) => {
          const scalar = getScalarFromStaticDynamicData(staticDynamicNodeData[nodeID], field);
          return filterValue(scalar, filter);
        });
      }
    }

    return nodes !== null ? (subgraph(graph, nodes) as G) : graph;
  }

  // Edges:
  else {
    let edges: string[] | null = null;
    if (filter.type === "script") {
      const fullGraph = dataGraphToFullGraph(dataset, graph);
      edges = graph.filterEdges((edgeID) =>
        filter.script ? filter.script(edgeID, fullGraph.getEdgeAttributes(edgeID), fullGraph) : true,
      );
    } else {
      if (filter.field) {
        const dynamicEdgeData = filter.field.dynamic ? computeAllDynamicAttributes("edges", graph) : {};
        const staticDynamicEdgeData = mergeStaticDynamicData(edgeData, dynamicEdgeData);
        const field = filter.field;
        edges = graph.filterEdges((edgeID) => {
          const scalar = getScalarFromStaticDynamicData(staticDynamicEdgeData[edgeID], field);
          return filterValue(scalar, filter);
        });
      }
    }
    if (edges !== null) {
      const res = graph.emptyCopy() as G;
      edges.forEach((id) => res.addEdgeWithKey(id, graph.source(id), graph.target(id), graph.getEdgeAttributes(id)));
      return res;
    } else return graph;
  }
}

export function getFilterFingerprint(filter: FilterType): string {
  return gephiLiteStringify(filter);
}

export function applyFilters(
  dataset: GraphDataset,
  filters: FilterType[],
  cache: FilteredGraph[],
  topologicalFiltersDefinitions: TopologicalFilterDefinition[],
): FilteredGraph[] {
  const steps: FilteredGraph[] = [];

  filters.reduce((graph, filter, i) => {
    const filterFingerprint = getFilterFingerprint(filter);

    let subgraph: DatalessGraph;
    if (!filter.disabled) {
      const cacheStep = cache[i];

      if (cacheStep?.filterFingerprint === filterFingerprint) {
        subgraph = cacheStep.graph;
      } else {
        cache = [];
        subgraph = filterGraph(graph, dataset, filter, topologicalFiltersDefinitions);
      }
    } else {
      subgraph = graph.copy();
    }

    steps.push({ filterFingerprint, graph: subgraph });
    return subgraph;
  }, dataset.fullGraph);

  return steps;
}
