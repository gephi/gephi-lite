import { kCore } from "graphology-cores";
import { t } from "i18next";

import { FilterNumberParameter, TopologicalFilterType } from "../types";

export const kCoreFilter: TopologicalFilterType<[FilterNumberParameter]> = {
  type: "topological",
  id: "kCore",
  label: t("filters.topology.kCore.label"),
  summary: ([coreParam]) => t("filters.topology.kCore.summary", { core: coreParam.value }),
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
  filter(parameters, graph) {
    return kCore(graph, parameters[0].value || parameters[0].defaultValue);
  },
};
