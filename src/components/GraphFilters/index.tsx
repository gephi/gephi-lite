import cx from "classnames";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsCheckSquare } from "react-icons/bs";
import { CgRemoveR } from "react-icons/cg";
import { FiEdit } from "react-icons/fi";
import { RiFilterLine, RiFilterOffLine } from "react-icons/ri";

import { useFilters, useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
import { filteredGraphsAtom } from "../../core/graph";
import { useReadAtom } from "../../core/utils/atoms";
import { GraphIcon } from "../common-icons";
import { FilterCreator } from "./FilterCreator";
import { RangeFilter } from "./RangeFilter";
import { ScriptFilter } from "./ScriptFilter";
import { TermsFilter } from "./TermsFilter";
import { TopologicalFilter } from "./TopologicalFilter";

const FilterInStack: FC<{
  filter: FilterType;
  active?: boolean;
  filterIndex: number;
}> = ({ filter, filterIndex, active = false }) => {
  const filters = useFilters();
  const { openPastFilter, deleteFutureFilter, deletePastFilter, openFutureFilter } = useFiltersActions();
  const { t } = useTranslation();
  const filteredGraphs = useReadAtom(filteredGraphsAtom);
  const relatedGraph = filteredGraphs[filterIndex]?.graph;

  const editMode: boolean = active && filterIndex === filters.past.length - 1;
  // internalEditMode is an internal state which is used to mimic edit/confirm state for the last filter
  // indeed this filter is always active, but it's unnecessary to bring this weird status to the user
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
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          {/*  filter downstream ongoing edition => disabled */}
          {!active && <RiFilterOffLine title={t("filters.desactivated").toString()} className="icon" />}
          {active && filterIndex !== filters.past.length - 1 && (
            <RiFilterLine title={t("filters.activated").toString()} className="icon" />
          )}
          {/* upstream filters => can be edited  only if no other edit ongoing*/}
          {active && filterIndex === filters.past.length - 1 && (
            <div
              title={filterIndex === filters.past.length - 1 ? undefined : t("filters.no_concurrent_edit").toString()}
            >
              <button
                className="btn btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setInternalEditMode(!internalEditMode);
                }}
                title={t("common.edit").toString()}
                disabled={filterIndex !== filters.past.length - 1}
              >
                {internalEditMode ? <BsCheckSquare /> : <FiEdit />}
              </button>
            </div>
          )}
        </div>
        <div className="flex-grow-1">
          {filter.type === "range" && (
            <RangeFilter filter={filter} editMode={editMode && internalEditMode} active={active} />
          )}
          {filter.type === "terms" && (
            <TermsFilter filter={filter} editMode={editMode && internalEditMode} active={active} />
          )}
          {filter.type === "script" && (
            <ScriptFilter filter={filter} editMode={editMode && internalEditMode} active={active} />
          )}
          {filter.type === "topological" && (
            <TopologicalFilter filter={filter} editMode={editMode && internalEditMode} active={active} />
          )}
          {active && relatedGraph && (
            <div className="small text-muted">
              {relatedGraph.order} {t("graph.model.nodes", { count: relatedGraph.order })}, {relatedGraph.size}{" "}
              {t("graph.model.edges", { count: relatedGraph.size })}
            </div>
          )}
        </div>
        <div className="d-flex align-items-center">
          <button
            className="btn btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              if (active) deletePastFilter(filterIndex);
              else deleteFutureFilter(filterIndex);
            }}
            title={t("common.remove").toString()}
          >
            <CgRemoveR />
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
        className={cx("filter-item d-flex align-items-center", filters.past.length !== 0 && "cursor-pointer")}
        onClick={() => {
          if (filters.past.length !== 0) closeAllPastFilters();
        }}
      >
        <GraphIcon className="icon" />
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
