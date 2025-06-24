import { FieldModelTypeSpec, Scalar, toDate, toNumber, toString, toStringArray } from "@gephi/gephi-lite-sdk";
import { isNumber, sortBy, take, uniq } from "lodash";
import { DateTime } from "luxon";

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
    return { type: "number" };
  }
  // DATE

  if (values.every((v) => DateTime.fromISO("" + v).isValid))
    // TODO: detect ISO format
    return { type: "date" };

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

export function formatScalar(
  scalar: Scalar,
  fieldModel: FieldModelTypeSpec,
): string | number | DateTime | string[] | undefined {
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

// Is field suitable for range/terms filter
// => extract value method for filterValue in /packages/gephi-lite/src/core/filters/utils.ts

// Is field suitable for rank/partition appearance
// => extract value method for makeGetNumberAttr and makeGetColor in packages/gephi-lite/src/core/appearance/utils.ts

// Raw data level
// ItemsData with Scalar value(see toScalar in packages/sdk/src/utils/casting.ts)

// FieldModel level
// Describe how to interprete raw data

// Field Models influence:
// Field Selection in Appearance/Filters like in packages/gephi-lite/src/components/GraphAppearance/color/ColorItem.tsx
// How to extract values from raw Data to fuel Appearance/filters (not done today)
// How to build Field Edition UI for users see packages/gephi-lite/src/views/graphPage/modals/edition/UpdateNodeModal.tsx
