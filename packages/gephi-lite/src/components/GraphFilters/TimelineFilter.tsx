import cx from "classnames";
import { clamp, flatMap, keyBy, last, mapValues, max, min, uniq } from "lodash";
import { DateTime } from "luxon";
import Slider, { SliderProps } from "rc-slider";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { TimelineFilterType } from "../../core/filters/types";
import { inRangeIncluded } from "../../core/filters/utils";
import { useFilteredGraphAt } from "../../core/graph";
import {
  computeAllDynamicAttributes,
  getScalarFromStaticDynamicData,
  mergeStaticDynamicData,
} from "../../core/graph/dynamicAttributes";
import { castScalarToModelValue } from "../../core/graph/fieldModel";
import { findRanges, shortenNumber } from "./utils";

interface TimeRange {
  min: number;
  max: number;
  values: number[];
}

interface TimelineMetric {
  unit: number;
  step: number;
  min: number;
  max: number;
  maxCount: number;
  ranges: TimeRange[];
}

const TIMELINE_STYLE = {
  dotStyle: { borderColor: "#ccc" },
  railStyle: { backgroundColor: "#ccc" },
  activeDotStyle: { borderColor: "black" },
  trackStyle: [{ backgroundColor: "black" }, { backgroundColor: "black" }],
};

export const TimelineFilter: FC<{ filter: TimelineFilterType; filterIndex: number }> = ({ filter, filterIndex }) => {
  const parentGraph = useFilteredGraphAt(filterIndex - 1);

  const { edgeData } = useGraphDataset();

  const { t } = useTranslation();
  const { updateFilter } = useFiltersActions();

  const [timelineMetric, setTimelineMetric] = useState<TimelineMetric>();

  useEffect(() => {
    const itemData = mergeStaticDynamicData(
      edgeData,
      filter.field.dynamic ? computeAllDynamicAttributes("edges", parentGraph) : {},
    );

    const timestamps = flatMap(parentGraph.edges(), (edgeId) => {
      const scalar = getScalarFromStaticDynamicData(itemData[edgeId], filter.field);
      const value = castScalarToModelValue(scalar, filter.field);
      if (value instanceof DateTime) {
        return [value.toMillis()];
      }
      return [];
    });

    const minTimestamp = min(timestamps);
    const maxTimestamp = max(timestamps);

    if (minTimestamp !== undefined && maxTimestamp !== undefined) {
      const { unit, ranges } = findRanges(minTimestamp, maxTimestamp);
      const step = unit < 1 || unit >= 10 ? unit / 10 : 1;
      const rangeValues = ranges.map((range) => {
        const rangeTimestamps = timestamps.filter(
          (t) => (!range[0] || range[0] <= t) && (!range[1] || t < range[1]),
        );
        return {
          min: range[0],
          max: range[1],
          values: rangeTimestamps,
        };
      });

      setTimelineMetric({
        min: ranges[0][0],
        max: (last(ranges) || ranges[0])[1],
        step,
        unit,
        ranges: rangeValues,
        maxCount: Math.max(...rangeValues.map((r) => r.values.length)),
      });
    }
  }, [filter.field, parentGraph, edgeData]);

  const marks: SliderProps["marks"] = timelineMetric
    ? mapValues(
        keyBy(
          uniq(
            timelineMetric.ranges
              .flatMap((r) => [r.min, r.max])
              .concat([
                filter.minDate || timelineMetric.min,
                filter.maxDate !== undefined ? filter.maxDate + timelineMetric.step : timelineMetric.max,
              ]),
          ),
        ),
        () => "",
      )
    : {};

  const formatTimestamp = (timestamp: number) => {
    return DateTime.fromMillis(timestamp).toFormat("yyyy-MM-dd");
  };

  if (!timelineMetric) return null;

  const filteredGraph = useFilteredGraphAt(filterIndex);
  const filteredEdgeData = mergeStaticDynamicData(
    edgeData,
    filter.field.dynamic ? computeAllDynamicAttributes("edges", filteredGraph) : {},
  );

  return (
    <>
      <div className="filter-content">
        <label htmlFor={`filter-${filterIndex}-timeline`}>{t("filters.timeline.label")}</label>

        <ul className="range-filter-barchart">
          {timelineMetric.ranges.map((range, i) => {
            const globalCount = range.values.length;
            const filteredTimestamps = filteredGraph.edges().filter((edgeId) => {
              const scalar = getScalarFromStaticDynamicData(filteredEdgeData[edgeId], filter.field);
              const value = castScalarToModelValue(scalar, filter.field);
              if (value instanceof DateTime) {
                const t = value.toMillis();
                return range.min <= t && t < range.max;
              }
              return false;
            });
            const filteredCount = filteredTimestamps.length;

            const globalHeight = (globalCount / timelineMetric.maxCount) * 100;
            const filteredHeight = (filteredCount / timelineMetric.maxCount) * 100;
            const isLabelInside = filteredHeight > 40;
            return (
              <li key={i} className="bar">
                <div className="global" style={{ height: globalHeight + "%" }}>
                  <div
                    className="filtered"
                    style={{
                      height: (filteredHeight / globalHeight) * 100 + "%",
                    }}
                  >
                    {filteredCount !== 0 && (
                      <span className={cx("label", isLabelInside ? "inside" : "outside")}>
                        {shortenNumber(filteredCount, globalCount)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Slider
          className="pb-3"
          range
          disabled={timelineMetric.min === timelineMetric.max}
          value={[
            filter.minDate ?? timelineMetric.min,
            (filter.maxDate ?? timelineMetric.max) + timelineMetric.step,
          ].map((n) => clamp(n, timelineMetric.min, timelineMetric.max + timelineMetric.step))}
          {...timelineMetric}
          marks={marks}
          onChange={(value) => {
            if (Array.isArray(value)) {
              const [minSelected, maxSelected] = value;
              const newMin = minSelected;
              const newMax = maxSelected;

              updateFilter(filterIndex, {
                ...filter,
                minDate: newMin === timelineMetric.min ? undefined : newMin,
                maxDate: newMax - timelineMetric.step === timelineMetric.max ? undefined : newMax - timelineMetric.step,
              });
            }
          }}
          {...TIMELINE_STYLE}
        />

        <div className="row mb-3">
          <div className="col">
            <label htmlFor={`filter-${filterIndex}-min`}>{t("filters.range.min")}</label>
            <input
              id={`filter-${filterIndex}-min`}
              type="text"
              disabled={timelineMetric.min === timelineMetric.max}
              className="form-control"
              value={filter.minDate ? formatTimestamp(filter.minDate) : ""}
              placeholder={formatTimestamp(timelineMetric.min)}
              readOnly
            />
          </div>
          <div className="col">
            <label htmlFor={`filter-${filterIndex}-max`}>{t("filters.range.max")}</label>
            <input
              id={`filter-${filterIndex}-max`}
              type="text"
              disabled={timelineMetric.min === timelineMetric.max}
              className="form-control"
              value={filter.maxDate ? formatTimestamp(filter.maxDate) : ""}
              placeholder={formatTimestamp(timelineMetric.max)}
              readOnly
            />
          </div>
        </div>
      </div>
    </>
  );
};
