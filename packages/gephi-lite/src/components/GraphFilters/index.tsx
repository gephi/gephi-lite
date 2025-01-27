import cx from "classnames";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CgRemoveR } from "react-icons/cg";

import { useFilters, useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
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
  const { openPastFilter, deleteFutureFilter, deletePastFilter, openFutureFilter } = useFiltersActions();
  const { t } = useTranslation();

  const editMode = !!active && filterIndex === filters.past.length - 1;
  // internalEditMode is an internal state which is used to mimic edit/confirm state for the last filter
  // indeed this filter is always active but it's unecessary to bring this weird status to the user
  // thus the internalEditMode is used to toggle Edit/Confirmed state for the last filter without affecting others filters state
  const [internalEditMode, setInternalEditMode] = useState<boolean>(editMode);
  useEffect(() => setInternalEditMode(editMode), [editMode]);

  return (
    <div
      className={cx(
        "filter-item d-flex flex-column",
        (!active || filterIndex !== filters.past.length - 1) && "cursor-pointer",
        !active && "inactive",
        editMode && "edited",
      )}
      onClick={() => {
        if (active) {
          if (filterIndex !== filters.past.length - 1) openPastFilter(filterIndex);
        } else openFutureFilter(filterIndex);
      }}
    >
      <div className="d-flex  flex-column justify-content-between align-items-start">
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
        <div className="w-100 d-flex justify-content-center align-items-center">
          <button
            className="btn btn-outline-dark border-0"
            onClick={(e) => {
              e.stopPropagation();
              if (active) deletePastFilter(filterIndex);
              else deleteFutureFilter(filterIndex);
            }}
            title={t("common.remove").toString()}
          >
            <CgRemoveR /> {t("common.remove").toString()}
          </button>
        </div>
      </div>
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
  const filters = useFilters();

  const { t } = useTranslation();
  const { closeAllPastFilters } = useFiltersActions();
  const { fullGraph } = useGraphDataset();

  return (
    <div className="panel-block-grow">
      <div
        className={cx(
          "filter-item d-flex align-items-center",
          filters.past.length !== 0 && "cursor-pointer",
          filters.past.length === 0 && "edited",
        )}
        onClick={() => {
          if (filters.past.length !== 0) closeAllPastFilters();
        }}
      >
        <div>
          <div className="fs-5">{t("filters.full_graph")}</div>
          <div className="small text-muted">
            {fullGraph.order} {t("graph.model.nodes", { count: fullGraph.order })}, {fullGraph.size}{" "}
            {t("graph.model.edges", { count: fullGraph.size })}
          </div>
        </div>
      </div>

      <FiltersStack filters={filters.past} active />

      <FilterCreator />

      <FiltersStack filters={filters.future} />
    </div>
  );
};

export default GraphFilters;
