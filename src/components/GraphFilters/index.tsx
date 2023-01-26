import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsCheckSquare } from "react-icons/bs";
import { CgRemoveR } from "react-icons/cg";
import { FiEdit } from "react-icons/fi";
import { AiFillEdit } from "react-icons/ai";
import { RiFilterFill, RiFilterLine, RiFilterOffLine } from "react-icons/ri";

import { useFilters, useFiltersActions } from "../../core/context/dataContexts";

import { FilterType } from "../../core/filters/types";

import { FilterCreator } from "./FilterCreator";
import { RangeFilter } from "./RangeFilter";
import { TermsFilter } from "./TermsFilter";

const FilterInStack: FC<
  PropsWithChildren & {
    filter: FilterType;
    active?: boolean;
    filterIndex: number;
  }
> = ({ children, filter, filterIndex, active }) => {
  const filters = useFilters();
  const { deleteCurrentFilter, openAllFutureFilters, openPastFilter } = useFiltersActions();
  const { t } = useTranslation();

  const editMode = !!active && filterIndex === filters.past.length - 1;

  return (
    <div className="d-flex align-items-top justify-content-between">
      <div className="d-flex align-items-center">
        {editMode && <RiFilterFill className="flex-shrink-0" />}
        {active && !editMode && <RiFilterLine />}
        {!active && <RiFilterOffLine />}
        {!editMode && filters.future.length === 0 && (
          <button
            className="btn btn-icon"
            onClick={() => {
              openPastFilter(filterIndex);
            }}
            title={t("common.edit").toString()}
          >
            <FiEdit />
          </button>
        )}
        {editMode && filters.future.length !== 0 && (
          <button
            className="btn btn-icon"
            onClick={() => {
              openAllFutureFilters();
            }}
            title={t("common.edit").toString()}
          >
            <BsCheckSquare />
          </button>
        )}
        {editMode && filters.future.length === 0 && <AiFillEdit style={{ margin: "0 0.75rem" }} />}
      </div>
      <div className="flex-grow-1 ms-2">
        {filter.type === "range" && <RangeFilter filter={filter} editMode={editMode} active={active} />}
        {filter.type === "terms" && <TermsFilter filter={filter} editMode={editMode} active={active} />}
      </div>
      <button className="btn btn-icon" onClick={() => deleteCurrentFilter()} title={t("common.remove").toString()}>
        <CgRemoveR />
      </button>
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

  return (
    <div>
      <FiltersStack filters={filters.past} active />

      <FiltersStack filters={filters.future} />
      <hr />
      <FilterCreator />
    </div>
  );
};

export default GraphFilters;
