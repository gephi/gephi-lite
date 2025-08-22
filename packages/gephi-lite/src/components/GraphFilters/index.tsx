import { default as classNames, default as cx } from "classnames";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFilters, useFiltersActions, useGraphDataset, usePreferences } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
import { TrashIcon } from "../common-icons";
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
  const { deleteFutureFilter, deletePastFilter } = useFiltersActions();
  const { t } = useTranslation();

  const editMode = !!active && filterIndex === filters.past.length - 1;
  // internalEditMode is an internal state which is used to mimic edit/confirm state for the last filter
  // indeed this filter is always active, but it's unnecessary to bring this weird status to the user
  // thus the internalEditMode is used to toggle Edit/Confirmed state for the last filter without affecting others filters state
  const [internalEditMode, setInternalEditMode] = useState<boolean>(editMode);
  useEffect(() => setInternalEditMode(editMode), [editMode]);

  return (
    <div
      className={cx(
        "filter-item d-flex flex-column",
        active ? "active" : "inactive",
        editMode && "edited",
        !active && filterIndex === filters.future.length - 1 && "last-step",
      )}
    >
      <div className="filter-separator" />
      <div className="d-flex flex-column gl-gap-1 w-100 gl-px-3">
        <div className="filter-chain" />
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

      <section className="filter-footer gl-px-2 d-flex flex-row justify-content-center">
        <button
          className="gl-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (active) deletePastFilter(filterIndex);
            else deleteFutureFilter(filterIndex);
          }}
          title={t("common.remove").toString()}
        >
          <TrashIcon /> {t("common.remove").toString()}
        </button>
      </section>
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
  const { closeAllPastFilters } = useFiltersActions();

  return (
    <div className="panel-body px-0 pb-0">
      <div className="panel-block flex-grow-1 gap-0">
        <div className={cx("filter-item d-flex flex-column w-100 gl-px-3", filters.past.length === 0 && "edited")}>
          <div className="filter-chain first-step" />
          <h2 className="position-relative">
            <button type="button" className="gl-btn" disabled={filters.past.length === 0} onClick={closeAllPastFilters}>
              {/* {disabled ? (
                        <PiCircleFill
                          className={classNames("filter-chain-point", active ? "gl-container-highest-bg" : "gl-container-high-bg")}
                        />
                      ) : (
                        <PiCircleBold className="filter-chain-point" />
                      )} */}
              {filters.past.length === 0 ? (
                <div className="filter-chain-point current" />
              ) : (
                <div className={classNames("filter-chain-point")} />
              )}
              {t("filters.full_graph")}
            </button>
          </h2>
          <div className="gl-px-3">
            {fullGraph.order.toLocaleString(locale)} {t("graph.model.nodes", { count: fullGraph.order })},{" "}
            {fullGraph.size.toLocaleString(locale)} {t("graph.model.edges", { count: fullGraph.size })}
          </div>
        </div>

        <FiltersStack filters={filters.past} active />

        <FilterCreator />

        <FiltersStack filters={filters.future} />

        {filters.past.length > 0 && filters.future.length > 0 && (
          <div className="flex-grow-1 gl-container-high-bg"></div>
        )}
      </div>
    </div>
  );
};

export default GraphFilters;
