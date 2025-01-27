import { subgraph } from "graphology-operators";
import { t } from "i18next";

import { NodeComponentById } from "../../../components/Node";
import { FilterEnumParameter, FilterNodeParameter, FilterNumberParameter, TopologicalFilterType } from "../types";

export type TraversalMode = "in" | "out" | "both";

export const egoFilter = (
  directed: boolean,
): TopologicalFilterType<[FilterNodeParameter, FilterNumberParameter, FilterEnumParameter<TraversalMode>]> => ({
  type: "topological",
  id: "ego",
  label: t("filters.topology.ego.label"),
  summary: (params) => (
    <div>
      {params[0].value && (
        <div className="d-inline-block">
          <NodeComponentById id={params[0].value} />
        </div>
      )}
      <span className="ms-1 align-top">
        {t("filters.topology.ego.summary_depth", {
          depth: params[1].value || params[1].defaultValue,
        }) +
          (directed
            ? ` ${t("filters.topology.ego.summary_direction", {
                direction: t(`filters.topology.ego.direction.${params[2].value || params[2].defaultValue}`),
              })}`
            : "")}
      </span>
    </div>
  ),
  parameters: [
    {
      id: "egoId",
      type: "node",
      label: t("filters.topology.ego.ego"),
      required: true,
    },
    {
      id: "depth",
      type: "number",
      label: t("filters.topology.ego.core"),
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      id: "direction",
      type: "enum",
      label: t("filters.topology.ego.direction.label"),
      required: true,
      options: [
        { value: "in", label: t("filters.topology.ego.direction.in") },
        { value: "out", label: t("filters.topology.ego.direction.out") },
        { value: "both", label: t("filters.topology.ego.direction.both") },
      ],
      defaultValue: directed ? "out" : "both",
      hidden: !directed,
    },
  ],
  filter(parameters, graph) {
    const ego = parameters[0].value;
    const direction = parameters[2].value || parameters[2].defaultValue;

    const getNeighbors = (n: string) => {
      return direction === "in"
        ? graph.inboundNeighbors(n)
        : direction === "out"
          ? graph.outboundNeighbors(n)
          : graph.neighbors(n);
    };

    if (ego !== undefined && graph.hasNode(ego)) {
      const nodes = new Set([ego]);
      const maxDepth = parameters[1].value || parameters[1].defaultValue;
      let depth = 0;
      let neighbors = new Set([ego]);
      while (depth <= maxDepth && neighbors.size > 0) {
        const nextIterationNeighbors = new Set<string>();
        neighbors.forEach((n) => {
          nodes.add(n);
          getNeighbors(n).forEach((n) => nextIterationNeighbors.add(n));
        });
        depth += 1;
        neighbors = nextIterationNeighbors;
      }

      return subgraph(graph, Array.from(nodes));
    }
    return graph;
  },
});
