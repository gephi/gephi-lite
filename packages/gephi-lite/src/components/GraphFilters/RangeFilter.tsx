import cx from "classnames";
import { clamp, flatMap, isNumber, keyBy, mapValues, sortedIndex, sortedLastIndex, uniq } from "lodash";
import Slider, { SliderProps } from "rc-slider";
import { FC, useMemo } from "react";
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
import { buildRangeMetric, shortenNumber } from "./utils";

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

  const rangeMetric = useMemo(() => {
    const itemData = mergeStaticDynamicData(
      filter.itemType === "nodes" ? nodeData : edgeData,
      // dynamic field should be calculated from parent graph and not from the useDynamicItemData which provide data in the current graph
      filter.itemType === "nodes"
        ? computeAllDynamicAttributes("nodes", parentGraph)
        : computeAllDynamicAttributes("edges", parentGraph),
    );

    const values = flatMap(filter.itemType === "nodes" ? parentGraph.nodes() : parentGraph.edges(), (itemId) => {
      const v = getFieldValueForQuantification(itemData[itemId], filter.field);
      if (typeof v === "number" && Number.isFinite(v)) return [v];
      return [];
    });
    return buildRangeMetric(values);
  }, [filter.itemType, filter.field, parentGraph, nodeData, edgeData]);

  const dateSlider = useMemo(() => {
    if (!rangeMetric || filter.field.type !== "date") return undefined;
    const { values } = rangeMetric;
    const lastIndex = values.length - 1;
    return {
      values,
      minIndex: filter.min === undefined ? 0 : clamp(sortedIndex(values, filter.min), 0, lastIndex),
      maxIndex: filter.max === undefined ? lastIndex : clamp(sortedLastIndex(values, filter.max) - 1, 0, lastIndex),
    };
  }, [filter.field.type, filter.max, filter.min, rangeMetric]);

  const marks: SliderProps["marks"] = rangeMetric
    ? mapValues(
        keyBy(
          uniq(
            rangeMetric.ranges
              .flatMap((r) => [r.min, r.max])
              .concat([
                filter.min ?? rangeMetric.min,
                filter.max !== undefined ? filter.max + rangeMetric.step : rangeMetric.max,
              ]),
          ),
        ),
        () => ({ label: " ", style: { fontWeight: "bold", background: "white", padding: "0 0.2em", zIndex: 1 } }),
      )
    : {};

  return (
    <form onSubmit={(e) => e.preventDefault()} className="range-filter">
      {!rangeMetric ? (
        <div className="alert gl-alert-info p-2 mb-2 mt-2 text-wrap">{t("filters.noValidRangeValues")}</div>
      ) : rangeMetric.max !== rangeMetric.min ? (
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
          {dateSlider ? (
            <Slider
              className="pb-3"
              range
              min={0}
              max={dateSlider.values.length - 1}
              step={1}
              value={[dateSlider.minIndex, dateSlider.maxIndex]}
              onChange={(value) => {
                if (Array.isArray(value)) {
                  const [minIndex, maxIndex] = value;
                  updateFilter(filterIndex, {
                    ...filter,
                    min: minIndex === 0 ? undefined : dateSlider.values[minIndex],
                    max: maxIndex === dateSlider.values.length - 1 ? undefined : dateSlider.values[maxIndex],
                  });
                }
              }}
              allowCross={false}
              pushable={true}
              {...RANGE_STYLE}
            />
          ) : (
            <Slider
              className="pb-3"
              range
              min={rangeMetric.min}
              max={rangeMetric.max + rangeMetric.step}
              step={rangeMetric.step}
              value={[
                filter.min ?? rangeMetric.min,
                // max is shifted + step as slider exclude upper bound
                (filter.max ?? rangeMetric.max) + rangeMetric.step,
              ].map((n) => clamp(n, rangeMetric.min, rangeMetric.max + rangeMetric.step))}
              marks={marks}
              onChange={(value) => {
                if (Array.isArray(value)) {
                  const [minSelected, maxSelected] = value;
                  updateFilter(filterIndex, {
                    ...filter,
                    min: minSelected === rangeMetric.min ? undefined : minSelected,
                    // max is shifted - step as slider exclude upper bound
                    max:
                      maxSelected === rangeMetric.max + rangeMetric.step ? undefined : maxSelected - rangeMetric.step,
                  });
                }
              }}
              allowCross={false}
              pushable={true}
              {...RANGE_STYLE}
            />
          )}
          {dateSlider && (
            <div className="range-filter-date-labels text-muted small">
              <span>
                {serializeModelValueToScalar(
                  getFieldValueFromQuantification(dateSlider.values[0], filter.field),
                  filter.field,
                  undefined,
                )}
              </span>
              <span>
                {serializeModelValueToScalar(
                  getFieldValueFromQuantification(dateSlider.values[dateSlider.values.length - 1], filter.field),
                  filter.field,
                  undefined,
                )}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="alert gl-alert-info p-2 mb-2 mt-2 text-wrap">{t("filters.inapplicable")}</div>
      )}

      {rangeMetric && (
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
      )}
      <div className="form-check mt-1">
        <input
          className="form-check-input"
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
  );
};
