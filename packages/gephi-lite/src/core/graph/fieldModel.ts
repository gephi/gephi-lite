import {
  FieldModel,
  FieldModelAbstraction,
  FieldModelType,
  FieldModelTypeSpec,
  FieldModelTypeSpecCollection,
  ItemType,
  ModelValueType,
  Scalar,
  StaticDynamicItemData,
  toDate,
  toNumber,
  toString,
  toStringArray,
} from "@gephi/gephi-lite-sdk";
import { countBy, mean, size, sortBy, take, uniq } from "lodash";
import { DateTime } from "luxon";

import { isNumber } from "../../components/GraphFilters/utils";
import { isValidColor } from "../../utils/colors";
import { DATE_FORMATS } from "../../utils/date";
import linkify, { normalizeURL } from "../../utils/linkify";
import { getScalarFromStaticDynamicData } from "./dynamicAttributes";

const BOOLEAN_ACCEPTED_VALUES = new Set<Scalar>([true, false, "true", "false", 1, 0]);

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
      if (split.length > 1 && split.every((s) => !!s.trim())) separatorsFrequencies[sep]++;
    }),
  );

  const bestSeparator = sortBy(
    SEPARATORS.filter((sep) => separatorsFrequencies[sep] >= values.length / 10),
    (sep) => -separatorsFrequencies[sep],
  )[0];

  return bestSeparator || null;
}

/**
 * This function takes an array of string values, and tries to find a consensual enough data format
 * to interpret the most possible of them.
 */
export function guessDateFormat(values: string[]): string | null {
  const formatsFrequencies = DATE_FORMATS.reduce(
    (iter, { format }) => ({
      ...iter,
      [format]: 0,
    }),
    {},
  ) as Record<string, number>;

  values.forEach((value) =>
    DATE_FORMATS.forEach(({ format }) => {
      const { isValid } = DateTime.fromFormat(value, format);
      if (isValid) formatsFrequencies[format]++;
    }),
  );

  const bestSeparator = sortBy(
    DATE_FORMATS.filter(({ format }) => formatsFrequencies[format] >= values.length / 10),
    ({ format }) => -formatsFrequencies[format],
  )[0];

  return bestSeparator?.format || null;
}

/**
 * This function detects an error ratio, given a list of values and a predicate.
 */
export function getErrorRatio<T>(values: T[], predicate: (v: T) => boolean): number {
  const totalLength = values.length;
  const onlyValidLength = values.filter(predicate).length;

  return (totalLength - onlyValidLength) / totalLength;
}

/**
 * This function takes an unqualified field model and a list af values, and
 * guesses the field type
 */
export function inferFieldType(fieldName: string, values: Scalar[], itemsCount: number): FieldModelTypeSpec {
  const cleanedFieldName = fieldName.trim().toLowerCase();
  const first100StringValues = take(
    values.map((v) => "" + v),
    100,
  );

  // URLS
  if (getErrorRatio(values, (v) => typeof v === "string" && linkify.test(v)) < 0.05) return { type: "url" };

  // BOOLEANS
  if (
    getErrorRatio(values, (v) => BOOLEAN_ACCEPTED_VALUES.has(typeof v === "string" ? v.trim().toLowerCase() : v)) < 0.05
  )
    return { type: "boolean" };

  // COLOR
  if (getErrorRatio(values, (v) => typeof v === "string" && isValidColor(v)) < 0.05) return { type: "color" };

  // DATES
  const format = guessDateFormat(first100StringValues);
  if (format) {
    const errorRatio = getErrorRatio(first100StringValues, (v) => !!toDate(v, format));

    if (errorRatio <= 0.05) {
      return { type: "date", format };
    }
  }

  // NUMBER
  if (getErrorRatio(values, (v) => isNumber(v)) < 0.01) {
    if (new Set(["size", "weight", "rawsize", "rawweight", "degree"]).has(cleanedFieldName)) return { type: "number" };

    // Numbers non uniq & in series from 0 or 1 => category
    const numberValues = values.flatMap((v) => (isNumber(v) ? [toNumber(v) as number] : []));
    const uniqValues = sortBy(uniq(numberValues));
    if (uniqValues.length < numberValues.length) {
      const isSeriesFrom0Or1 = uniqValues.every(
        (v, i) => (i === 0 && (v === 0 || v === 1)) || i === uniqValues.length - 1 || v === uniqValues[i + 1] - 1,
      );

      if (isSeriesFrom0Or1) return { type: "category" };
    }

    return { type: "number" };
  }

  // KEYWORDS
  const separator = guessSeparator(first100StringValues);
  if (separator) {
    const splitValuesCounts = countBy(values.flatMap((v) => (v + "").split(separator)));
    const uniqSplitValuesCount = size(splitValuesCounts);
    const averageValuesCount = mean(Object.values(splitValuesCounts));

    if (averageValuesCount > 2 && uniqSplitValuesCount > 1 && uniqSplitValuesCount < itemsCount) {
      return { type: "keywords", separator };
    }
  }

  // CATEGORIES
  const uniqValuesCount = uniq(values).length;
  if (uniqValuesCount > 1 && uniqValuesCount < Math.pow(values.length, 0.75)) {
    return { type: "category" };
  }

  // TEXT
  return { type: "text" };
}

export function castScalarToModelValue<T extends FieldModelType = FieldModelType>(
  scalar: Scalar,
  fieldModel: FieldModelTypeSpecCollection[T],
): FieldModelAbstraction[T]["expectedOutput"] | undefined {
  switch (fieldModel.type) {
    case "number":
      return toNumber(scalar);
    case "url": {
      const str = toString(scalar) || "";
      return normalizeURL(str);
    }
    case "color": {
      const str = toString(scalar) || "";
      return isValidColor(str) ? str : undefined;
    }
    case "category":
    case "text":
      return toString(scalar);
    case "keywords":
      return toStringArray(scalar, (fieldModel as FieldModelAbstraction["keywords"]["options"]).separator);
    case "date":
      return toDate(scalar, (fieldModel as FieldModelAbstraction["date"]["options"]).format);
    case "boolean":
      if (typeof scalar === "boolean") return scalar;
      if (scalar === 1 || (typeof scalar === "string" && scalar.trim().toLowerCase() === "true")) return true;
      if (scalar === 0 || (typeof scalar === "string" && scalar.trim().toLowerCase() === "false")) return false;
      return undefined;
    default:
      throw new Error(`Unknown field type ${fieldModel.type}`);
  }
}

export function castScalarToQuantifiableValue<F extends FieldModelType = FieldModelType>(
  scalar: Scalar,
  field: FieldModel<ItemType, boolean, F>,
): number | undefined {
  const value = castScalarToModelValue<F>(scalar, field);
  switch (field.type) {
    case "number":
      return value as number;
    case "date":
      return value !== undefined && value instanceof DateTime ? value.toMillis() : undefined;
    case "text":
    case "color":
    case "boolean":
    case "category":
    case "keywords":
      return undefined;
  }
}

export function getFieldValue<F extends FieldModelType = FieldModelType>(
  data: StaticDynamicItemData,
  field: FieldModel<ItemType, boolean, F>,
) {
  return castScalarToModelValue<F>(getScalarFromStaticDynamicData(data, field), field);
}

export const getFieldValueFromQuantification = (
  valueAsNumber: number | undefined,
  field: FieldModel<ItemType, boolean>,
): ModelValueType => {
  switch (field.type) {
    case "number":
      return valueAsNumber as number;
    case "date": {
      const date = valueAsNumber !== undefined ? DateTime.fromMillis(valueAsNumber) : undefined;
      return date && date.isValid ? date : undefined;
    }
    case "text":
    case "color":
    case "boolean":
    case "category":
    case "keywords":
      return undefined;
  }
};

export function getFieldValueForQuantification<F extends FieldModelType = FieldModelType>(
  data: StaticDynamicItemData,
  field: FieldModel<ItemType, boolean, F>,
): number | undefined {
  const scalar = getScalarFromStaticDynamicData(data, field);
  return castScalarToQuantifiableValue(scalar, field);
}

export class CastValueError extends Error {}

export function serializeModelValueToScalar(
  value: ModelValueType,
  fieldModel: FieldModelTypeSpec,
  originalScalar: Scalar,
): Scalar {
  if (value === undefined) return undefined;

  switch (fieldModel.type) {
    case "number":
      if (typeof value !== "number") return originalScalar;
      // TODO: once we port the new fieldmodel into GEXF or other serialization decide to keep throw mechanism or fallback to original scalar.
      // throw new CastValueError("Wrong number value")};
      return value;
    case "category":
    case "text":
    case "url":
    case "color":
      if (typeof value !== "string") return originalScalar; // throw new CastValueError(`Wrong ${fieldModel.type} value`);
      return value;
    case "keywords":
      if (!Array.isArray(value) || value.some((v: unknown) => typeof v !== "string")) return originalScalar; // throw new CastValueError("Wrong keywords value");
      return value.join(fieldModel.separator);
    case "date":
      if (!(value instanceof DateTime)) return originalScalar; // throw new CastValueError("Wrong Date value");
      return value.toFormat(fieldModel.format);
    case "boolean":
      if (typeof value !== "boolean") return originalScalar;
      return value;
  }
}
