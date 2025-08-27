import cx from "classnames";
import { clamp, flatMap, isNumber, keyBy, last, mapValues, max, min, uniq } from "lodash";
import Slider, { SliderProps } from "rc-slider";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { RangeFilterType } from "../../core/filters/types";
import { inRangeIncluded } from "../../core/filters/utils";
import { useFilteredGraphAt } from "../../core/graph";
import { computeAllDynamicAttributes, mergeStaticDynamicData } from "../../core/graph/dynamicAttributes";
import {
  castScalarToQuantifiableValue,
  getFieldValueForQuantification,
  getFieldValueFromQuantification,
  serializeModelValueToScalar,
} from "../../core/graph/fieldModel";
import { EditItemAttribute } from "../data/Attribute";
import { findRanges, shortenNumber } from "./utils";

interface RangeValue {
  min: number;
  max: number;
  values: number[];
}

interface RangeMetric {
  unit: number;
  step: number;
  min: number;
  max: number;
  maxCount: number;
  ranges: RangeValue[];
}

const RANGE_STYLE = {
  dotStyle: { borderColor: "#ccc" },
  railStyle: { backgroundColor: "#ccc" },
  activeDotStyle: { borderColor: "black" },
  trackStyle: [{ backgroundColor: "black" }, { backgroundColor: "black" }],
};

export const RangeFilter: FC<{ filter: RangeFilterType; filterIndex: number }> = ({ filter, filterIndex }) => {
  const parentGraph = useFilteredGraphAt(filterIndex - 1);

  const { nodeData, edgeData } = useGraphDataset();

  const { t } = useTranslation();
  const { updateFilter } = useFiltersActions();

  const [rangeMetric, setRangeMetric] = useState<RangeMetric>();

  useEffect(() => {
    const itemData = mergeStaticDynamicData(
      filter.itemType === "nodes" ? nodeData : edgeData,
      // dynamic field should be calculated from parent graph and not from the useDynamicItemData which provide data in the current graph
      filter.itemType === "nodes"
        ? computeAllDynamicAttributes("nodes", parentGraph)
        : computeAllDynamicAttributes("edges", parentGraph),
    );

    const values = flatMap(filter.itemType === "nodes" ? parentGraph.nodes() : parentGraph.edges(), (itemId) => {
      const v = getFieldValueForQuantification(itemData[itemId], filter.field);
      if (v && (typeof v === "number" || !isNaN(+v))) return [v];
      return [];
    }) as number[];
    const minValue = min(values);
    const maxValue = max(values);
    if (minValue && maxValue) {
      const { unit, ranges } = findRanges(minValue, maxValue);
      const step = unit < 1 || unit >= 10 ? unit / 10 : 1;
      const rangeValues = ranges.map((range) => {
        // we don't use the generic  inRangeIncluded method as slider exclude upper bound
        const rangeValues = values.filter((v) => (!range[0] || range[0] <= v) && (!range[1] || v < range[1]));
        return {
          min: range[0],
          max: range[1],
          values: rangeValues,
        };
      });

      setRangeMetric({
        min: ranges[0][0],
        max: (last(ranges) || ranges[0])[1],
        step,
        unit,
        ranges: rangeValues,
        maxCount: Math.max(...rangeValues.map((r) => r.values.length)),
      });
    }
  }, [filter.itemType, filter.field, parentGraph, nodeData, edgeData]);

  const marks: SliderProps["marks"] = rangeMetric
    ? mapValues(
        keyBy(
          uniq(
            rangeMetric.ranges
              .flatMap((r) => [r.min, r.max])
              .concat([filter.min || rangeMetric.min, filter.max ? filter.max + rangeMetric.step : rangeMetric.max]),
          ),
        ),
        () => ({ label: " ", style: { fontWeight: "bold", background: "white", padding: "0 0.2em", zIndex: 1 } }),
      )
    : {};

  return rangeMetric ? (
    <form onSubmit={(e) => e.preventDefault()} className="range-filter">
      {rangeMetric.max !== rangeMetric.min ? (
        <>
          <ul className="range-filter-barchart">
            {(rangeMetric.ranges || []).map((range) => {
              const globalCount = range.values.length;
              const filteredCount = range.values.filter((v) => inRangeIncluded(v, filter.min, filter.max)).length;
              const filteredHeight = (filteredCount / rangeMetric.maxCount) * 100;
              const isLabelInside = filteredHeight > 90;

              return (
                <div className="bar" key={range.min}>
                  <div className="global" style={{ height: (globalCount / rangeMetric.maxCount) * 100 + "%" }} />
                  <div
                    className="filtered"
                    style={{
                      height: filteredHeight + "%",
                    }}
                  >
                    {filteredCount !== 0 && (
                      <span className={cx("label", isLabelInside ? "inside" : "outside")}>
                        {shortenNumber(filteredCount, globalCount)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </ul>
          <Slider
            className="pb-3"
            range
            disabled={rangeMetric.min === rangeMetric.max}
            value={[
              filter.min ?? rangeMetric.min,
              // max is shifted + step as slider exclude upper bound
              (filter.max ?? rangeMetric.max) + rangeMetric.step,
            ].map((n) => clamp(n, rangeMetric.min, rangeMetric.max + rangeMetric.step))}
            {...rangeMetric}
            marks={marks}
            onChange={(value) => {
              if (Array.isArray(value)) {
                const [minSelected, maxSelected] = value;
                const newMin = minSelected;
                const newMax = maxSelected;

                // max is shifted - step as slider exclude upper bound
                updateFilter(filterIndex, {
                  ...filter,
                  min: newMin === rangeMetric.min ? undefined : newMin,
                  max: newMax === rangeMetric.max ? undefined : newMax - rangeMetric.step,
                });
              }
            }}
            allowCross={false}
            pushable={true}
            {...RANGE_STYLE}
          />
        </>
      ) : (
        <div className="alert gl-alert-info p-2 mb-2 mt-2 text-wrap">{t("filters.inapplicable")}</div>
      )}

      <div className="range-inputs">
        <div>
          <label htmlFor={`filter-${filterIndex}-min`}>{t("common.from")}</label>
          {filter.field.type === "number" ? (
            // We don't use generic EditItem Attribute to keep step, min, max, disabled parameters
            // TODO: add all input props in generic component ?
            <input
              id={`filter-${filterIndex}-min`}
              type="number"
              disabled={rangeMetric.min === rangeMetric.max}
              min={rangeMetric?.min}
              max={filter.max ?? rangeMetric.max}
              step={rangeMetric?.step}
              value={filter.min ?? ""}
              placeholder={"" + rangeMetric?.min}
              onChange={(e) => {
                updateFilter(filterIndex, { ...filter, min: e.target.value ? +e.target.value : undefined });
              }}
            />
          ) : (
            // TODO: add all input props in generic component ? We miss min/max and disabled here
            <EditItemAttribute
              id={`filter-${filterIndex}-min`}
              field={filter.field}
              scalar={serializeModelValueToScalar(
                getFieldValueFromQuantification(filter.min, filter.field),
                filter.field,
                undefined,
              )}
              onChange={(scalar) => {
                const value = castScalarToQuantifiableValue(scalar, filter.field);
                updateFilter(filterIndex, { ...filter, min: isNumber(value) ? value : undefined });
              }}
            />
          )}
        </div>

        <div>
          <label htmlFor={`filter-${filterIndex}-max`}>{t("common.to")}</label>
          {filter.field.type === "number" ? (
            // We don't use generic EditItem Attribute to keep step, min, max, disabled parameters
            // TODO: add all input props in generic component ?
            <input
              id={`filter-${filterIndex}-max`}
              type="number"
              disabled={rangeMetric.min === rangeMetric.max}
              min={filter.min ?? rangeMetric.min}
              // max is shifted - step as slider exclude upper bound
              max={rangeMetric?.max - rangeMetric.step}
              step={rangeMetric?.step}
              // max is shifted - step as slider exclude upper bound
              placeholder={"" + (rangeMetric?.max - rangeMetric.step)}
              value={filter.max ?? ""}
              onChange={(e) => {
                updateFilter(filterIndex, { ...filter, max: e.target.value ? +e.target.value : undefined });
              }}
            />
          ) : (
            <EditItemAttribute
              id={`filter-${filterIndex}-max`}
              field={filter.field}
              scalar={serializeModelValueToScalar(
                getFieldValueFromQuantification(filter.max, filter.field),
                filter.field,
                undefined,
              )}
              onChange={(scalar) => {
                const value = castScalarToQuantifiableValue(scalar, filter.field);
                updateFilter(filterIndex, { ...filter, max: isNumber(value) ? value : undefined });
              }}
            />
          )}
        </div>
      </div>
      <div className="form-check mt-1">
        <input
          className="form-check-input"
          disabled={rangeMetric.min === rangeMetric.max}
          type="checkbox"
          id={`filter-${filterIndex}-keepMissingValuesRange`}
          checked={filter.keepMissingValues}
          onChange={(e) => {
            updateFilter(filterIndex, { ...filter, keepMissingValues: e.target.checked });
          }}
        />
        <label className="from-check-label small" htmlFor={`filter-${filterIndex}-keepMissingValuesRange`}>
          {t("filters.keepMissingValues")}
        </label>
      </div>
    </form>
  ) : null;
};
