import {
  FieldModelTypeSpec,
  ModelValueType,
  Scalar,
  toDate,
  toNumber,
  toString,
  toStringArray,
} from "@gephi/gephi-lite-sdk";
import guessFormat from "@gristlabs/moment-guess";
import { isNumber, sortBy, take, toPairs, uniq } from "lodash";

/**
 * This function takes an array of string values, and tries various separators
 * to see if one does match enough values.
 */
const SEPARATORS = [";", ",", "|"] as const;
type Separator = (typeof SEPARATORS)[number];
export function guessSeparator(values: string[]): string | null {
  const separatorsFrequencies = SEPARATORS.reduce(
    (iter, sep) => ({
      ...iter,
      [sep]: 0,
    }),
    {},
  ) as Record<Separator, number>;

  values.forEach((value) =>
    SEPARATORS.forEach((sep) => {
      const split = value.split(sep);
      if (split.length > 1 && split.every((s) => !!s && !s.match(/(^ | $)/))) separatorsFrequencies[sep]++;
    }),
  );

  const bestSeparator = sortBy(
    SEPARATORS.filter((sep) => !!separatorsFrequencies[sep]),
    (sep) => -separatorsFrequencies[sep],
  )[0];
  return bestSeparator || null;
}

/**
 * This function takes an unqualified field model and a list af values, and
 * guesses whether that field should be considered qualitative and/or
 * quantitative:
 */
export function inferFieldType(values: Scalar[], itemsCount: number): FieldModelTypeSpec {
  // NUMBER
  if (values.every((v) => isNumber(v))) {
    // Numbers non uniq & in series from 0 or 1 => category
    const uniqValues = sortBy(uniq(values));
    if (uniqValues.length < values.length) {
      const isSeriesFrom0Or1 = uniqValues.every(
        (v, i) => (i === 0 && (v === 0 || v === 1)) || i === uniqValues.length - 1 || v === uniqValues[i + 1] - 1,
      );

      if (isSeriesFrom0Or1) return { type: "category" };
    }

    return { type: "number" };
  }
  // DATE
  const dateFormats: Record<string, number> = {};
  if (
    values.every((v) => {
      try {
        const _dateFormat = guessFormat("" + v);
        // format guesser can return multiple choices, we just pick one
        const dateFormat = Array.isArray(_dateFormat) ? _dateFormat[0] : _dateFormat;
        dateFormats[dateFormat] = (dateFormats[dateFormat] || 0) + 1;
        return true;
      } catch {
        return false;
      }
    })
  ) {
    const [format] = sortBy(toPairs(dateFormats), ([, count]) => -1 * count)[0];
    return { type: "date", format };
  }

  // KEYWORDS and CATEGORY
  const separator = guessSeparator(
    take(
      values.map((v) => "" + v),
      100,
    ),
  );
  const uniqValues = uniq(separator ? values.flatMap((v) => (v + "").split(separator)) : values);
  const uniqValuesCount = uniqValues.length;

  if (
    uniqValuesCount > 1 &&
    uniqValuesCount < 50 &&
    uniqValuesCount < Math.max(separator ? itemsCount : Math.pow(itemsCount, 0.75), 5)
  ) {
    // category and keywords
    if (separator) return { type: "keywords", separator };
    else return { type: "category" };
  }
  // TEXT
  return { type: "text" };
}

export function castScalarToModelValue(scalar: Scalar, fieldModel: FieldModelTypeSpec): ModelValueType {
  switch (fieldModel.type) {
    case "number":
      return toNumber(scalar);
    case "category":
    case "text":
      return toString(scalar);
    case "keywords":
      return toStringArray(scalar, fieldModel.separator);
    case "date":
      return toDate(scalar, fieldModel.format);
  }
}

// Raw data level
// ItemsData with Scalar value(see toScalar in packages/sdk/src/utils/casting.ts)

// FieldModel level
// Describe how to interprete raw data

// Field Models influence:
// Field Selection in Appearance/Filters like in packages/gephi-lite/src/components/GraphAppearance/color/ColorItem.tsx
// How to extract values from raw Data to fuel Appearance/filters (not done today)
// How to build Field Edition UI for users see packages/gephi-lite/src/views/graphPage/modals/edition/UpdateNodeModal.tsx
