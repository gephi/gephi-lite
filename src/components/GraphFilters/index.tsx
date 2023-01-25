import { FC, PropsWithChildren, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useFilters, useFiltersActions } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";

import { FilterCreator } from "./FilterCreator";
import { RangeFilter } from "./RangeFilter";
import { TermsFilter } from "./TermsFilter";

const FilterInStack: FC<
  PropsWithChildren & { filter: FilterType; active?: boolean; current?: boolean; filterIndex: number }
> = ({ children, filter, filterIndex, current, active }) => {
  const { deleteCurrentFilter, openPastFilter, openFutureFilter } = useFiltersActions();

  const { t } = useTranslation();
  return (
    <div className="d-flex">
      {current ? (
        <button className="btn btn-primary" onClick={() => deleteCurrentFilter()}>
          {t("button.remove")}
        </button>
      ) : (
        <button
          className="btn btn-primary"
          onClick={() => (active ? openPastFilter(filterIndex) : openFutureFilter(filterIndex))}
        >
          edit
        </button>
      )}
      {filter.type === "range" && <RangeFilter filter={filter} editMode={current} active={active} />}
      {filter.type === "terms" && <TermsFilter filter={filter} editMode={current} active={active} />}
    </div>
  );
};

const FiltersStack: FC<{ filters: FilterType[]; active?: boolean }> = ({ filters, active }) => {
  return (
    <>
      {filters.map((f, i) => {
        const current = active && i === filters.length - 1;
        return <FilterInStack key={i} filter={f} active={active} current={current} filterIndex={i} />;
      })}
    </>
  );
};

const GraphFilters: FC = () => {
  const filters = useFilters();
  useEffect(() => {
    console.log(filters);
  }, [filters]);
  return (
    <div>
      <FiltersStack filters={filters.past} active />
      <FilterCreator />
      <FiltersStack filters={filters.future} />
    </div>
  );
};

export default GraphFilters;
