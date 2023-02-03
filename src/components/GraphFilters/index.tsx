import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsCheckSquare } from "react-icons/bs";
import { CgRemoveR } from "react-icons/cg";
import { FiEdit } from "react-icons/fi";
import { RiFilterLine, RiFilterOffLine } from "react-icons/ri";
import cx from "classnames";

import { useFilters, useFiltersActions } from "../../core/context/dataContexts";

import { FilterType } from "../../core/filters/types";

import { FilterCreator } from "./FilterCreator";
import { RangeFilter } from "./RangeFilter";
import { TermsFilter } from "./TermsFilter";
import { GraphIcon } from "../common-icons";

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
        "filter-item",
        (!active || filterIndex !== filters.past.length - 1) && "cursor-pointer",
        !active && "inactive",
      )}
      onClick={() => {
        if (active) {
          if (filterIndex !== filters.past.length - 1) openPastFilter(filterIndex);
        } else openFutureFilter(filterIndex);
      }}
    >
      <div className="d-flex align-items-center">
        {/*  filter downstream ongoing edition => disabled */}
        {!active && <RiFilterOffLine title={t("filters.desactivated").toString()} className="icon" />}
        {active && filterIndex !== filters.past.length - 1 && (
          <RiFilterLine title={t("filters.activated").toString()} className="icon" />
        )}
        {/* upstream filters => can be edited  only if no other edit ongoing*/}
        {active && filterIndex === filters.past.length - 1 && (
          <div title={filterIndex === filters.past.length - 1 ? undefined : t("filters.no_concurrent_edit").toString()}>
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
      <div className={"flex-grow-1"}>
        {filter.type === "range" && (
          <RangeFilter filter={filter} editMode={editMode && internalEditMode} active={active} />
        )}
        {filter.type === "terms" && (
          <TermsFilter filter={filter} editMode={editMode && internalEditMode} active={active} />
        )}
      </div>
      <div className="d-flex align-items-center">
        <button
          className="btn btn-icon"
          onClick={() => {
            if (active) deletePastFilter(filterIndex);
            else deleteFutureFilter(filterIndex);
          }}
          title={t("common.remove").toString()}
        >
          <CgRemoveR />
        </button>
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

  const { closeAllPastFilters } = useFiltersActions();

  return (
    <div>
      <div
        className={cx("filter-item", filters.past.length !== 0 && "cursor-pointer")}
        onClick={() => {
          if (filters.past.length !== 0) closeAllPastFilters();
        }}
      >
        <GraphIcon className="icon" />
        <div className="fs-5">Full Graph</div>
      </div>

      <FiltersStack filters={filters.past} active />

      <FiltersStack filters={filters.future} />
      <hr />
      <FilterCreator />
    </div>
  );
};

export default GraphFilters;
