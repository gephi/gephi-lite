import { MultiGraph } from "graphology";
import { connectedComponents } from "graphology-components";
import { subgraph } from "graphology-operators";
import _, { keyBy } from "lodash";

import { TopologicalFilterDefinition } from "./types";

export const TOPOLOGICAL_FILTERS: TopologicalFilterDefinition[] = [
  {
    id: "main-connected-components",
    description: true,
    parameters: [
      {
        id: "count",
        labelKey: "filters.topological_collection.main_connected_components.parameters.count",
        type: "number",
        min: 1,
        defaultValue: 1,
        step: 1,
      },
      {
        id: "directed",
        labelKey: "filters.topological_collection.main_connected_components.parameters.directed",
        type: "boolean",
        defaultValue: false,
      },
    ],
    fn: (parameters, graph) => {
      const count = parameters.count as number;
      // const directed = parameters.directed as boolean;

      const res = new MultiGraph();
      const components = _(connectedComponents(graph))
        .sortBy((nodes) => -nodes.length)
        .take(count)
        .value();
      components.forEach((nodes) => {
        res.import(subgraph(graph, nodes));
      });

      return res;
    },
  },
  {
    id: "filter-connected-components",
    description: true,
    parameters: [
      {
        id: "min-nodes",
        labelKey: "filters.topological_collection.filter_connected_components.parameters.min_nodes",
        type: "number",
        min: 1,
        defaultValue: 2,
        step: 1,
      },
      {
        id: "directed",
        labelKey: "filters.topological_collection.filter_connected_components.parameters.directed",
        type: "boolean",
        defaultValue: false,
      },
    ],
    fn: (parameters, graph) => {
      const minNodes = parameters["min-node"] as number;
      // const directed = parameters.directed as boolean;

      const res = new MultiGraph();
      const components = _(connectedComponents(graph))
        .filter((nodes) => nodes.length >= minNodes)
        .value();
      components.forEach((nodes) => {
        res.import(subgraph(graph, nodes));
      });

      return res;
    },
  },
];

export const TOPOLOGICAL_FILTERS_DICT = keyBy(TOPOLOGICAL_FILTERS, "id");
