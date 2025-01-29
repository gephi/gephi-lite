import { connectedComponents } from "graphology-components";
import { subgraph } from "graphology-operators";
import { t } from "i18next";
import { flatten, sortBy } from "lodash";

import { FilterNumberParameter, TopologicalFilterDefinition } from "../types";

export const largestConnectedComponentFilter: TopologicalFilterDefinition<[FilterNumberParameter]> = {
  type: "topological",
  id: "largestConnectedComponent",
  label: t("filters.topology.largestConnectedComponent.label"),
  summary: ([numberOfComponents]) =>
    t("filters.topology.largestConnectedComponent.summary", { number: numberOfComponents }),
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
  filter([numberOfComponents], graph) {
    const components = connectedComponents(graph);
    const componentstoKeep = sortBy(components, (c) => -1 * c.length).slice(0, numberOfComponents);

    return subgraph(graph, flatten(componentstoKeep));
  },
};
