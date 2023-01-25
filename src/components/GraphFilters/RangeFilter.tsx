import { flatMap, max, min } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions } from "../../core/context/dataContexts";
import { RangeFilterType } from "../../core/filters/types";
import { graphDatasetAtom } from "../../core/graph";

export const RangeFilterEditor: FC<{ filter: RangeFilterType }> = ({ filter }) => {
  const { t } = useTranslation();
  const { replaceCurrentFilter } = useFiltersActions();

  const [dataMinMax, setDataMinMax] = useState<{ min?: number; max?: number }>({});
  const [filterMinMax, setFilterMinMax] = useState<{ min?: number; max?: number }>({
    min: filter.min,
    max: filter.max,
  });

  useEffect(() => {
    const values = flatMap(
      filter.itemType === "nodes" ? graphDatasetAtom.get().nodeData : graphDatasetAtom.get().edgeData,
      (nodeData) => {
        const v = nodeData[filter.field];
        if (v && (typeof v === "number" || !isNaN(+v))) return [v];
        return [];
      },
    ) as number[];
    const minValue = min(values);
    const maxValue = max(values);
    setDataMinMax({ min: minValue, max: maxValue });
  }, [filter]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      Filter {filter.itemType} which {filter.field}
      <label htmlFor="min">{t("appearance.size.min")}</label>
      <input
        id="min"
        type="number"
        min={dataMinMax.min}
        max={filterMinMax.max}
        value={filterMinMax.min}
        onChange={(e) => {
          const newMin = e.target.value ? +e.target.value : undefined;
          setFilterMinMax({ min: newMin, max: filterMinMax.max });
          replaceCurrentFilter({ ...filter, min: newMin });
        }}
      />
      <label htmlFor="min">{t("appearance.size.max")}</label>
      <input
        id="max"
        type="number"
        min={filterMinMax.min}
        max={dataMinMax.max}
        value={filterMinMax.max}
        onChange={(e) => {
          const newMax = e.target.value ? +e.target.value : undefined;
          setFilterMinMax({ min: filterMinMax.min, max: newMax });
          replaceCurrentFilter({ ...filter, max: newMax });
        }}
      />
    </form>
  );
};

export const RangeFilter: FC<{ filter: RangeFilterType; active?: boolean; editMode?: boolean }> = ({
  filter,
  editMode,
  active,
}) => {
  if (editMode) return <RangeFilterEditor filter={filter} />;
  else
    return (
      <div>
        {active ? "filtering" : "filter"} {filter.itemType} on {filter.field} {filter.min && `[${filter.min}`}-
        {filter.max && `${filter.max}]`}
      </div>
    );
};
