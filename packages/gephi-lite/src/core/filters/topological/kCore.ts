import { kCore } from "graphology-cores";
import { t } from "i18next";

import { FilterBooleanParameter, FilterNumberParameter, TopologicalFilterDefinition } from "../types";

export const buildKCoreFilterDefinition = (): TopologicalFilterDefinition<
  [FilterNumberParameter, FilterBooleanParameter]
> => ({
  type: "topological",
  id: "kCore",
  label: t("filters.topology.kCore.label"),
  parameters: [
    {
      id: "core",
      type: "number",
      label: t("filters.topology.kCore.core"),
      required: true,
      defaultValue: 2,
      min: 1,
    },
    {
      id: "keepSelfLoops",
      type: "boolean",
      label: t("filters.topology.kCore.keepSelfLoop"),
      required: false,
      defaultValue: true,
    },
  ],
  filter([core, keepSelfLoops], graph) {
    if (graph.allowSelfLoops === false || graph.selfLoopCount === 0) return kCore(graph, core);
    else {
      const graphWithoutSelfLoop = graph.copy();
      // remove self loops to calculate k-core
      const selfLoops = graphWithoutSelfLoop.filterEdges((e) => graphWithoutSelfLoop.isSelfLoop(e));
      selfLoops.forEach((e) => graphWithoutSelfLoop.dropEdge(e));
      const kCoreResult = kCore(graphWithoutSelfLoop, core);

      if (keepSelfLoops)
        selfLoops.forEach((e) => {
          if (graph.isDirected(e))
            kCoreResult.addDirectedEdgeWithKey(e, graph.source(e), graph.target(e), graph.getEdgeAttributes(e));
          else kCoreResult.addUndirectedEdgeWithKey(e, graph.source(e), graph.target(e), graph.getEdgeAttributes(e));
        });

      return kCoreResult;
    }
  },
});
