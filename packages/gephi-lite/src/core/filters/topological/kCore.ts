import { kCore } from "graphology-cores";
import { t } from "i18next";

import { FilterNumberParameter, TopologicalFilterDefinition } from "../types";

export const buildKCoreFilterDefinition = (): TopologicalFilterDefinition<[FilterNumberParameter]> => ({
  type: "topological",
  id: "kCore",
  label: t("filters.topology.kCore.label"),
  summary: ([core]) => t("filters.topology.kCore.summary", { core: core }),
  parameters: [
    {
      id: "core",
      type: "number",
      label: t("filters.topology.kCore.core"),
      required: true,
      defaultValue: 2,
      min: 1,
    },
  ],
  filter([core], graph) {
    return kCore(graph, core);
  },
});
