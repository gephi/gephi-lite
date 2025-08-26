import { useReadAtom } from "@ouestware/atoms";
import { isNil } from "lodash";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useFilters, useGraphDataset, usePreferences } from "../../core/context/dataContexts";
import { filteredGraphsAtom } from "../../core/graph";

export const FilteredGraphSummary: FC<{ filterIndex?: number }> = ({ filterIndex }) => {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const { fullGraph } = useGraphDataset();
  const { filters } = useFilters();
  const filteredGraphs = useReadAtom(filteredGraphsAtom);
  const relatedGraph = !isNil(filterIndex) ? filteredGraphs[filterIndex]?.graph : fullGraph;

  return (
    <section className="filter-graph">
      {isNil(filterIndex) && <div>{t("filters.full_graph")}</div>}
      {filterIndex === filters.length - 1 && <div>{t("filters.visible_graph")}</div>}
      <div>
        {relatedGraph.order.toLocaleString(locale)} {t("graph.model.nodes", { count: relatedGraph.order })},{" "}
        {relatedGraph.size.toLocaleString(locale)} {t("graph.model.edges", { count: relatedGraph.size })}
      </div>
    </section>
  );
};
