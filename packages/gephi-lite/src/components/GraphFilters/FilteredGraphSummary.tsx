import { isNil } from "lodash";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useFilters, useFiltersActions, usePreferences } from "../../core/context/dataContexts";
import { useFilteredGraphAt } from "../../core/graph";
import { useModal } from "../../core/modals";
import Dropdown from "../Dropdown";
import { ThreeDotsVerticalIcon } from "../common-icons";
import SelectFilterModal from "../modals/SelectFilterModal";

export const FilteredGraphSummary: FC<{ filterIndex?: number }> = ({ filterIndex }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { filters } = useFilters();
  const { locale } = usePreferences();
  const { disableFiltersFrom } = useFiltersActions();
  const relatedGraph = useFilteredGraphAt(filterIndex ?? -1);
  const nextFilterIndex = (filterIndex ?? -1) + 1;
  const isVisibleGraph = !filters.slice(nextFilterIndex).some((filter) => !filter.disabled);

  return (
    <section className="filter-graph">
      <div className="gl-px-2">
        {isNil(filterIndex) ? (
          <div>
            {t("filters.full_graph")}
            {isVisibleGraph && ` / ${t("filters.visible_graph")}`}
          </div>
        ) : isVisibleGraph ? (
          <div>{t("filters.visible_graph")}</div>
        ) : (
          <div className="text-muted">{t("filters.intermediate_graph")}</div>
        )}
        <div>
          {relatedGraph.order.toLocaleString(locale)} {t("graph.model.nodes", { count: relatedGraph.order })},{" "}
          {relatedGraph.size.toLocaleString(locale)} {t("graph.model.edges", { count: relatedGraph.size })}
        </div>
      </div>
      <Dropdown
        side="right"
        options={[
          {
            label: t(`filters.insert`),
            onClick: () => {
              openModal({
                component: SelectFilterModal,
                arguments: {
                  filterIndex: nextFilterIndex,
                },
              });
            },
          },
          {
            label: t(`filters.disable_following`),
            title: t(`filters.disable_following_subtitle`),
            disabled: isVisibleGraph,
            onClick: () => {
              disableFiltersFrom(nextFilterIndex);
            },
          },
        ]}
      >
        <button className="gl-btn gl-btn-icon">
          <ThreeDotsVerticalIcon />
        </button>
      </Dropdown>
    </section>
  );
};
