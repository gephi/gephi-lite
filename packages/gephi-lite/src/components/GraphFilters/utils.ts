// copied from https://gitlab.com/ouestware/retina/-/blob/main/src/utils/number.ts#L3-20
import { FieldModel, FieldModelType, FilterType, ItemType } from "@gephi/gephi-lite-sdk";
import { inRange, round } from "lodash";

export const FILTER_TYPES_PER_FIELD_TYPES: Record<FieldModelType, "range" | "terms" | null> = {
  date: "range",
  number: "range",
  keywords: "terms",
  category: "terms",
  boolean: null,
  color: null,
  text: null,
  url: null,
};

export function createAttributeFilter(itemType: ItemType, field: FieldModel): FilterType | undefined {
  const type = FILTER_TYPES_PER_FIELD_TYPES[field.type];
  if (!type) return undefined;
  return { itemType, type, field, keepMissingValues: true };
}

export interface RangeValue {
  min: number;
  max: number;
  values: number[];
}

export interface RangeMetric {
  unit: number;
  step: number;
  min: number;
  max: number;
  maxCount: number;
  ranges: RangeValue[];
  values: number[];
}

export function findRanges(min: number, max: number): { unit: number; ranges: [number, number][] } {
  if (max <= min) return { ranges: [[Math.min(min, max), Math.max(min, max)]], unit: Math.abs(max - min) };

  const ranges: [number, number][] = [];

  const diff = max - min;
  const digits = Math.floor(Math.log10(diff)) - 1;
  const p = Math.pow(10, digits);
  const unit = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 1000].map((n) => n * p).find((n) => inRange(diff / n, 5, 15));

  if (!unit) return { ranges: [[min, max]], unit: max - min };

  for (let i = Math.floor(min / unit); i <= max / unit; i++) {
    ranges.push([round(i * unit, -digits), round((i + 1) * unit, -digits)]);
  }

  return { unit, ranges };
}

export function buildRangeMetric(inputValues: number[]): RangeMetric | undefined {
  const values = inputValues.filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) return undefined;

  const minValue = values[0];
  const maxValue = values[values.length - 1];
  const { unit, ranges } = findRanges(minValue, maxValue);
  const step = unit === 0 ? 1 : unit < 1 || unit >= 10 ? unit / 10 : 1;
  const rangeValues = ranges.map(([min, max], index) => ({
    min,
    max,
    values: values.filter((value) => min <= value && (index === ranges.length - 1 ? value <= max : value < max)),
  }));

  return {
    min: ranges[0][0],
    max: (ranges[ranges.length - 1] || ranges[0])[1],
    step,
    unit,
    ranges: rangeValues,
    values: Array.from(new Set(values)),
    maxCount: Math.max(...rangeValues.map((range) => range.values.length)),
  };
}
export function shortenNumber(n: number, extendSize?: number): string {
  if (n === 0) return "0";
  if (n < 0) return "-" + shortenNumber(-n, extendSize);
  const suffixes = ["", "k", "m", "b", "t"];
  const suffixNum = Math.floor(Math.log10(extendSize || n) / 3);
  const shortValue = suffixNum ? +(n / Math.pow(1000, suffixNum)).toFixed(2) : n;
  const label =
    suffixes[suffixNum] !== undefined
      ? (shortValue % 1 ? shortValue.toFixed(1) : shortValue) + suffixes[suffixNum]
      : n.toPrecision(3).replace(/\.?0+$/, "");
  return label;
}

export function isNumber(v: unknown): boolean {
  if (typeof v === "number") return true;
  if (typeof v === "string") {
    return !isNaN(+v);
  }

  return false;
}

export function toPairsCompatibleWithSymbol(
  termsOccurrences: Record<string | symbol, number>,
): [string | symbol, number][] {
  const pairs: [string | symbol, number][] = [];
  const terms = Reflect.ownKeys(termsOccurrences);
  terms.forEach((term) => {
    pairs.push([term, termsOccurrences[term]]);
  });
  return pairs;
}
