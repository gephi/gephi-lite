import { flatMap, isNumber, keyBy, last, mapValues, max, min, uniq } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Slider, { SliderProps } from "rc-slider";
import cx from "classnames";

import { useFiltersActions } from "../../core/context/dataContexts";
import { RangeFilterType } from "../../core/filters/types";
import { graphDatasetAtom } from "../../core/graph";
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
  handleStyle: [
    { backgroundColor: "white", borderColor: "black" },
    { backgroundColor: "white", borderColor: "black" },
  ],
};

export const RangeFilterEditor: FC<{ filter: RangeFilterType }> = ({ filter }) => {
  const { t } = useTranslation();
  const { replaceCurrentFilter } = useFiltersActions();

  const [rangeMetric, setRangeMetric] = useState<RangeMetric>();

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
    if (minValue && maxValue) {
      const { unit, ranges } = findRanges(minValue, maxValue);
      const rangeValues = ranges.map((range) => {
        const rangeValues = values.filter((v) => v >= range[0] && v < range[1]);
        return {
          min: range[0],
          max: range[1],
          values: rangeValues,
        };
      });

      setRangeMetric({
        min: ranges[0][0],
        max: (last(ranges) || ranges[0])[1],
        step: unit < 1 || unit >= 10 ? unit / 10 : 1,
        unit,
        ranges: rangeValues,
        maxCount: Math.max(...rangeValues.map((r) => r.values.length)),
      });
    }
  }, [filter.itemType, filter.field]);

  const marks: SliderProps["marks"] = rangeMetric
    ? mapValues(
        keyBy(
          uniq(
            rangeMetric.ranges
              .flatMap((r) => [r.min, r.max])
              .concat([filter.min || rangeMetric.min, filter.max || rangeMetric.max]),
          ),
        ),
        (v) =>
          v === filter.min || v === filter.max
            ? {
                label: shortenNumber(v),
                style: { fontWeight: "bold", background: "white", padding: "0 0.2em", zIndex: 1 },
              }
            : { label: " ", style: { fontWeight: "bold", background: "white", padding: "0 0.2em", zIndex: 1 } },
      )
    : {};

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {rangeMetric && (
        <ul className="list-unstyled range-filter">
          {(rangeMetric.ranges || []).map((range) => {
            const globalCount = range.values.length;
            const filteredCount = range.values.filter(
              (v) => !filter.min || (v >= filter.min && (!filter.max || v < filter.max)),
            ).length;
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
                  {filteredCount < globalCount && (
                    <span
                      className={cx("label", isLabelInside ? "inside" : "outside")}
                      //style={isLabelInside ? { color: fontColor } : undefined}
                    >
                      {shortenNumber(filteredCount)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </ul>
      )}

      <Slider
        className="pb-4 mb-3"
        range
        value={
          [
            filter.min !== undefined ? filter.min : rangeMetric?.min,
            filter.max !== undefined ? filter.max : rangeMetric?.max,
          ].filter((n) => isNumber(n)) as number[]
        }
        {...rangeMetric}
        marks={marks}
        onChange={(value) => {
          if (Array.isArray(value)) {
            const [minSelected, maxSelected] = value;
            replaceCurrentFilter({ ...filter, min: minSelected, max: maxSelected });
          }
        }}
        allowCross={false}
        {...RANGE_STYLE}
      />

      <div className="d-flex">
        <div className="d-flex align-items-center mt-1">
          <input
            className="form-control form-control-sm"
            id="min"
            type="number"
            min={rangeMetric?.min}
            // max={filter.max}
            step={rangeMetric?.step}
            value={filter.min}
            placeholder={"" + rangeMetric?.min}
            onChange={(e) => {
              const newMin = +e.target.value;
              replaceCurrentFilter({ ...filter, min: newMin });
            }}
          />
          <label className="form-check-label small ms-1" htmlFor="min">
            {t("common.min")}
          </label>
        </div>
        <div className="d-flex align-items-center mt-1 ms-1">
          <input
            className="form-control form-control-sm "
            id="max"
            type="number"
            min={filter.min}
            max={rangeMetric?.max}
            step={rangeMetric?.step}
            placeholder={"" + rangeMetric?.max}
            value={filter.max}
            onChange={(e) => {
              const newMax = +e.target.value;
              replaceCurrentFilter({ ...filter, max: newMax });
            }}
          />
          <label className="form-check-label small ms-1" htmlFor="max">
            {t("common.max")}
          </label>
        </div>
      </div>
    </form>
  );
};

export const RangeFilter: FC<{ filter: RangeFilterType; active?: boolean; editMode?: boolean }> = ({
  filter,
  editMode,
  active,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="fs-5">
        {filter.field} ({t(`graph.model.${filter.itemType}`)})
      </div>
      {editMode ? (
        <RangeFilterEditor filter={filter} />
      ) : (
        <div>
          <span className="fs-5">
            {filter.min ? `${filter.min}` : "∞"} - {filter.max ? `${filter.max}` : "∞"}
          </span>{" "}
        </div>
      )}
    </div>
  );
};
