import { connectedComponents } from "graphology-components";
import { subgraph } from "graphology-operators";
import { t } from "i18next";
import { flatten, sortBy } from "lodash";

import { FilterNumberParameter, TopologicalFilterType } from "../types";

export const largestConnectedComponentFilter: TopologicalFilterType<[FilterNumberParameter]> = {
  type: "topological",
  id: "largestConnectedComponent",
  label: t("filters.topology.largestConnectedComponent.label"),
  summary: ([numberParam]) => t("filters.topology.largestConnectedComponent.summary", { number: numberParam.value }),
  parameters: [
    {
      id: "numberOfComponents",
      type: "number",
      label: t("filters.topology.largestConnectedComponent.number"),
      required: true,
      defaultValue: 1,
      min: 1,
    },
  ],
  filter(parameters, graph) {
    const components = connectedComponents(graph);
    const componentstoKeep = sortBy(components, (c) => -1 * c.length).slice(0, parameters[0].value || 1);

    return subgraph(graph, flatten(componentstoKeep));
  },
};
