import { subgraph } from "graphology-operators";
import { t } from "i18next";

import { NodeComponentById } from "../../../components/Node";
import { FilterEnumParameter, FilterNodeParameter, FilterNumberParameter, TopologicalFilterDefinition } from "../types";

export type TraversalMode = "in" | "out" | "both";

export const egoFilter = (
  directed: boolean,
): TopologicalFilterDefinition<[FilterNodeParameter, FilterNumberParameter, FilterEnumParameter<TraversalMode>]> => ({
  type: "topological",
  id: "ego",
  label: t("filters.topology.ego.label"),
  summary: ([egoId, depth, direction]) => (
    <div>
      {typeof egoId === "string" && (
        <div className="d-inline-block">
          <NodeComponentById id={egoId} />
        </div>
      )}
      <span className="ms-1 align-top">
        {t("filters.topology.ego.summary_depth", {
          depth: depth,
        }) +
          (directed
            ? ` ${t("filters.topology.ego.summary_direction", {
                direction: t(`filters.topology.ego.direction.${direction}`),
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
  filter([egoId, maxDepth, direction], graph) {
    const getNeighbors = (n: string) => {
      return direction === "in"
        ? graph.inboundNeighbors(n)
        : direction === "out"
          ? graph.outboundNeighbors(n)
          : graph.neighbors(n);
    };

    if (typeof egoId !== "string" && graph.hasNode(egoId)) {
      const nodes = new Set([egoId as string]);
      let depth = 0;
      let neighbors = new Set([egoId as string]);
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
