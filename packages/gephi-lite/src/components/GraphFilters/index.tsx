import cx from "classnames";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useFilters, useFiltersActions } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
import { staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { useModal } from "../../core/modals";
import {
  FilterAddIcon,
  FilterDeleteIcon,
  FilterDisabledIcon,
  FilterEnabledIcon,
  GraphIcon,
  ItemTypeIcon,
} from "../common-icons";
import SelectFilterModal from "../modals/SelectFilterModal";
import { FilteredGraphSummary } from "./FilteredGraphSummary";
import { MissingValueFilter } from "./MissingValueFilter";
import { RangeFilter } from "./RangeFilter";
import { ScriptFilter } from "./ScriptFilter";
import { TermsFilter } from "./TermsFilter";
import { TopologicalFilter } from "./TopologicalFilter";

const FilterInStack: FC<{
  filter: FilterType;
  filterIndex: number;
}> = ({ filter, filterIndex }) => {
  const { t } = useTranslation();
  const { deleteFilter, updateFilter } = useFiltersActions();

  return (
    <>
      <div className={cx("filter-item d-flex flex-column", filter.disabled && "disabled")}>
        <div className="filter-title">
          <button
            className="gl-btn gl-heading-3 fw-bold w-100 d-flex"
            title={t("filters.desactivated")}
            onClick={(e) => {
              e.stopPropagation();
              updateFilter(filterIndex, { ...filter, disabled: !filter.disabled });
            }}
          >
            <span className="flex-grow-1 text-start text-truncate">
              {filter.type === "topological" ? (
                <GraphIcon className="me-2" />
              ) : (
                <ItemTypeIcon type={filter.itemType} className="me-2" />
              )}
              {(filter.type === "range" || filter.type === "terms") && staticDynamicAttributeLabel(filter.field)}
              {filter.type === "topological" && t(`filters.topology.${filter.topologicalFilterId}.label`)}
              {filter.type === "script" && t("filters.script")}

              {filter.type === "missingValue" && t("filters.missingValues")}
            </span>

            <span className="flex-shrink-0">{filter.disabled ? <FilterDisabledIcon /> : <FilterEnabledIcon />}</span>
          </button>
        </div>

        {!filter.disabled && (
          <div className="filter-content">
            {filter.type === "range" && <RangeFilter filter={filter} filterIndex={filterIndex} />}
            {filter.type === "terms" && <TermsFilter filter={filter} filterIndex={filterIndex} />}
            {filter.type === "script" && <ScriptFilter filter={filter} filterIndex={filterIndex} />}
            {filter.type === "topological" && <TopologicalFilter filter={filter} filterIndex={filterIndex} />}
            {filter.type === "missingValue" && <MissingValueFilter filter={filter} filterIndex={filterIndex} />}
          </div>
        )}

        <div className="filter-buttons">
          <button
            className="gl-btn gl-btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              deleteFilter(filterIndex);
            }}
          >
            <FilterDeleteIcon /> {t("filters.delete_filter")}
          </button>
        </div>
      </div>

      {!filter.disabled && <FilteredGraphSummary filterIndex={filterIndex} />}
    </>
  );
};

const GraphFilters: FC = () => {
  const { openModal } = useModal();
  const filters = useFilters();

  const { t } = useTranslation();

  return (
    <div className="panel-body px-0 pb-0 gap-0">
      <h2 className="px-3 mb-4">Filters</h2>

      <div className="panel-block flex-grow-1 gap-0">
        <FilteredGraphSummary />

        {filters.filters.map((f, i) => (
          <FilterInStack key={i} filter={f} filterIndex={i} />
        ))}

        <div className="filter-item filter-creator gl-px-3 d-flex justify-content-center">
          <button
            type="button"
            className="gl-btn gl-btn-fill w-100"
            onClick={() => {
              openModal({
                component: SelectFilterModal,
                arguments: {},
              });
            }}
          >
            <FilterAddIcon /> {t("filters.add_filter")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphFilters;
