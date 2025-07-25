import cx from "classnames";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsArrowDown } from "react-icons/bs";
import { PiScissors } from "react-icons/pi";

import { useFilters, useFiltersActions, useGraphDataset, usePreferences } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
import { FilterDeleteIcon, FilterDeleteInactiveIcon, FilterOpenFutureIcon } from "../common-icons";
import { FilterCreator } from "./FilterCreator";
import { RangeFilter } from "./RangeFilter";
import { ScriptFilter } from "./ScriptFilter";
import { TermsFilter } from "./TermsFilter";
import { TopologicalFilter } from "./TopologicalFilter";

const FilterInStack: FC<{
  filter: FilterType;
  active?: boolean;
  filterIndex: number;
}> = ({ filter, filterIndex, active }) => {
  const filters = useFilters();
  const { openPastFilter, deleteFutureFilter, deletePastFilter, openFutureFilter, closeAllPastFilters } =
    useFiltersActions();
  const { t } = useTranslation();

  const editMode = !!active && filterIndex === filters.past.length - 1;
  // internalEditMode is an internal state which is used to mimic edit/confirm state for the last filter
  // indeed this filter is always active, but it's unnecessary to bring this weird status to the user
  // thus the internalEditMode is used to toggle Edit/Confirmed state for the last filter without affecting others filters state
  const [internalEditMode, setInternalEditMode] = useState<boolean>(editMode);
  useEffect(() => setInternalEditMode(editMode), [editMode]);

  return (
    <div className={cx("filter-item d-flex flex-column", active ? "active" : "inactive", editMode && "edited")}>
      <div className="d-flex flex-column gl-gap-1 w-100 gl-px-3">
        {filter.type === "range" && (
          <RangeFilter
            filter={filter}
            filterIndex={filterIndex}
            editMode={editMode && internalEditMode}
            active={active}
          />
        )}
        {filter.type === "terms" && (
          <TermsFilter
            filter={filter}
            filterIndex={filterIndex}
            editMode={editMode && internalEditMode}
            active={active}
          />
        )}
        {filter.type === "script" && (
          <ScriptFilter
            filter={filter}
            filterIndex={filterIndex}
            editMode={editMode && internalEditMode}
            active={active}
          />
        )}
        {filter.type === "topological" && (
          <TopologicalFilter
            filter={filter}
            filterIndex={filterIndex}
            editMode={editMode && internalEditMode}
            active={active}
          />
        )}
      </div>

      <section className="gl-px-2 d-flex flex-row justify-content-between">
        <button
          className="gl-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (active) deletePastFilter(filterIndex);
            else deleteFutureFilter(filterIndex);
          }}
          title={t("common.remove").toString()}
        >
          {active ? <FilterDeleteIcon /> : <FilterDeleteInactiveIcon />} {t("common.remove").toString()}
        </button>

        {!editMode && !active && (
          <button
            className="gl-btn gl-btn-icon"
            onClick={() => {
              openFutureFilter(filterIndex);
            }}
          >
            <FilterOpenFutureIcon />
          </button>
        )}
      </section>

      {active && (
        <div className="filter-arrow-container">
          <span className="filter-arrow">
            <BsArrowDown />
          </span>
          <button
            className="gl-btn d-inline-flex gl-btn-icon"
            onClick={() => {
              if (filterIndex >= 1) openPastFilter(filterIndex - 1);
              else closeAllPastFilters();
            }}
          >
            <PiScissors />
          </button>
        </div>
      )}
    </div>
  );
};

const FiltersStack: FC<{ filters: FilterType[]; active?: boolean }> = ({ filters, active }) => {
  return (
    <>
      {filters.map((f, i) => {
        return <FilterInStack key={i} filter={f} active={active} filterIndex={i} />;
      })}
    </>
  );
};

const GraphFilters: FC = () => {
  const { locale } = usePreferences();
  const filters = useFilters();

  const { t } = useTranslation();
  const { fullGraph } = useGraphDataset();

  return (
    <div className="panel-body px-0 pb-0">
      <div className="panel-block flex-grow-1 gap-0">
        <div className={cx("filter-item d-flex flex-column w-100", filters.past.length === 0 && "edited")}>
          <h2 className="gl-px-3">{t("filters.full_graph")}</h2>
          <div className="gl-px-3">
            {fullGraph.order.toLocaleString(locale)} {t("graph.model.nodes", { count: fullGraph.order })},{" "}
            {fullGraph.size.toLocaleString(locale)} {t("graph.model.edges", { count: fullGraph.size })}
          </div>
        </div>

        <FiltersStack filters={filters.past} active />

        <FilterCreator />

        <FiltersStack filters={filters.future} />

        {(filters.past.length > 0 || filters.future.length > 0) && (
          <div className="flex-grow-1 gl-container-high-bg"></div>
        )}
      </div>
    </div>
  );
};

export default GraphFilters;
