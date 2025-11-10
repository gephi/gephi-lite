import cx from "classnames";
import { flatMap, last, max, min } from "lodash";
import { DateTime } from "luxon";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { TimelineFilterType } from "../../core/filters/types";
import { useFilteredGraphAt } from "../../core/graph";
import {
  computeAllDynamicAttributes,
  getScalarFromStaticDynamicData,
  mergeStaticDynamicData,
} from "../../core/graph/dynamicAttributes";
import { castScalarToModelValue } from "../../core/graph/fieldModel";
import { TimeRangeSlider } from "./TimeRangeSlider";
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

  // Call hooks before any early returns
  const filteredGraph = useFilteredGraphAt(filterIndex);

  if (!timelineMetric) return null;

  const filteredEdgeData = mergeStaticDynamicData(
    edgeData,
    filter.field.dynamic ? computeAllDynamicAttributes("edges", filteredGraph) : {},
  );

  return (
    <>
      <div className="filter-content">
        <label htmlFor={`filter-${filterIndex}-timeline`}>{t("Timeline")}</label>

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

        <TimeRangeSlider
          min={new Date(timelineMetric.min)}
          max={new Date(timelineMetric.max)}
          value={[
            new Date(filter.minDate ?? timelineMetric.min),
            new Date(filter.maxDate ?? timelineMetric.max),
          ]}
          onChange={(range) => {
            const [minDate, maxDate] = range;
            const newMin = minDate.getTime();
            const newMax = maxDate.getTime();

            updateFilter(filterIndex, {
              ...filter,
              minDate: newMin === timelineMetric.min ? undefined : newMin,
              maxDate: newMax === timelineMetric.max ? undefined : newMax,
            });
          }}
          step={timelineMetric.step}
          disabled={timelineMetric.min === timelineMetric.max}
        />

        <div className="form-check mt-3">
          <input
            className="form-check-input"
            type="checkbox"
            id={`filter-${filterIndex}-fade-mode`}
            checked={filter.fadeInsteadOfHide ?? false}
            onChange={(e) => {
              updateFilter(filterIndex, {
                ...filter,
                fadeInsteadOfHide: e.target.checked,
              });
            }}
            disabled={timelineMetric.min === timelineMetric.max}
          />
          <label className="form-check-label" htmlFor={`filter-${filterIndex}-fade-mode`}>
            {t("Fade Nodes")}
            {" "}
            <small className="text-muted">({t("Keep filtered items visible with low opacity instead of hiding them")})</small>
          </label>
        </div>
      </div>
    </>
  );
};
