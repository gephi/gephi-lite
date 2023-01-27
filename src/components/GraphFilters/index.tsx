import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsCheckSquare } from "react-icons/bs";
import { CgRemoveR } from "react-icons/cg";
import { FiEdit } from "react-icons/fi";
import { RiFilterOffLine } from "react-icons/ri";
import cx from "classnames";

import { useFilters, useFiltersActions } from "../../core/context/dataContexts";

import { FilterType } from "../../core/filters/types";

import { FilterCreator } from "./FilterCreator";
import { RangeFilter } from "./RangeFilter";
import { TermsFilter } from "./TermsFilter";
import { Toggle } from "../Toggle";
import { FiltersIcon } from "../common-icons";

const FilterInStack: FC<
  PropsWithChildren & {
    filter: FilterType;
    active?: boolean;
    filterIndex: number;
  }
> = ({ children, filter, filterIndex, active }) => {
  const filters = useFilters();
  const { openAllFutureFilters, openPastFilter, deleteFutureFilter, deletePastFilter } = useFiltersActions();
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
        "d-flex align-items-top justify-content-between mt-2 border  px-1 py-2",
        active ? "border-secondary" : "text-muted",
      )}
    >
      <div className="d-flex align-items-center">
        {/*  filter downstream ongoing edition => disabled */}
        {!active && <RiFilterOffLine title={t("filters.desactivated").toString()} style={{ margin: "0 0.75rem" }} />}
        {/* upstream filters => can be edited  only if no other edit ongoing*/}
        {(!editMode || !internalEditMode) && active && (
          <div title={filters.future.length === 0 ? undefined : t("filters.no_concurrent_edit").toString()}>
            <button
              className="btn btn-icon"
              onClick={() => {
                if (filters.future.length === 0 && editMode) setInternalEditMode(!internalEditMode);
                else openPastFilter(filterIndex);
              }}
              title={t("common.edit").toString()}
              disabled={filters.future.length > 0}
            >
              <FiEdit />
            </button>
          </div>
        )}
        {/* ongoing edition => button to confirm */}
        {editMode && internalEditMode && (
          <button
            className="btn btn-icon"
            onClick={() => {
              openAllFutureFilters();
              if (filters.future.length === 0 && editMode) setInternalEditMode(!internalEditMode);
            }}
            title={t("common.confirm").toString()}
          >
            <BsCheckSquare />
          </button>
        )}
      </div>
      <div className={"flex-grow-1 ms-2"}>
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

  const { openAllFutureFilters, closeAllPastFilters } = useFiltersActions();
  const [filtersActive, setFiltersActive] = useState<boolean>(filters.past.length > 0 || filters.future.length === 0);

  useEffect(() => {
    if (filtersActive) {
      openAllFutureFilters();
    } else {
      closeAllPastFilters();
    }
  }, [filtersActive, openAllFutureFilters, closeAllPastFilters]);

  return (
    <div>
      <div className="d-flex justify-content-center mb-4">
        <Toggle
          disabled={
            (filters.future.length > 0 && filters.past.length > 0) ||
            (filters.future.length === 0 && filters.past.length === 0)
          }
          value={filtersActive}
          onChange={setFiltersActive}
          leftLabel={
            <>
              <RiFilterOffLine className="me-1" /> inactive
            </>
          }
          rightLabel={
            <>
              <FiltersIcon className="me-1" /> active
            </>
          }
        />
      </div>

      <FiltersStack filters={filters.past} active />

      <FiltersStack filters={filters.future} />
      <hr />
      <FilterCreator />
    </div>
  );
};

export default GraphFilters;
