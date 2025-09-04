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
import guessFormat from "@gristlabs/moment-guess";
import { countBy, isNumber, mean, size, sortBy, take, toPairs, uniq } from "lodash";
import { DateTime } from "luxon";

import { isValidColor } from "../../utils/colors";
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

  // URLS
  if (getErrorRatio(values, (v) => typeof v === "string" && linkify.test(v)) < 0.05) return { type: "url" };

  // BOOLEANS
  if (getErrorRatio(values, (v) => BOOLEAN_ACCEPTED_VALUES.has(v)) < 0.05) return { type: "url" };

  // COLOR
  if (getErrorRatio(values, (v) => typeof v === "string" && isValidColor(v)) < 0.05) return { type: "color" };

  // NUMBER
  if (getErrorRatio(values, (v) => isNumber(v)) < 0.01) {
    if (new Set(["size", "weight", "degree"]).has(cleanedFieldName)) return { type: "number" };

    // Numbers non uniq & in series from 0 or 1 => category
    const uniqValues = sortBy(uniq(values.filter((v) => isNumber(v))));
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
    getErrorRatio(values, (v) => {
      try {
        const _dateFormat = guessFormat("" + v, "");

        // format guesser can return multiple choices, we just pick one
        const dateFormat = Array.isArray(_dateFormat) ? _dateFormat[0] : _dateFormat;
        const correctedDateFormat = dateFormat.replaceAll("Y", "y").replaceAll("D", "d");

        dateFormats[correctedDateFormat] = (dateFormats[correctedDateFormat] || 0) + 1;
        return true;
      } catch {
        return false;
      }
    }) < 0.05
  ) {
    const [format] = sortBy(toPairs(dateFormats), ([, count]) => -1 * count)[0];
    return { type: "date", format };
  }

  // KEYWORDS
  const separator = guessSeparator(
    take(
      values.map((v) => "" + v),
      100,
    ),
  );
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
  if (uniqValuesCount > 1 && uniqValuesCount < Math.max(Math.pow(itemsCount, 0.75), 5)) {
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
      return toString(scalar) || "";
    case "keywords":
      return toStringArray(scalar, (fieldModel as FieldModelAbstraction["keywords"]["options"]).separator);
    case "date":
      return toDate(scalar, (fieldModel as FieldModelAbstraction["date"]["options"]).format);
    case "boolean":
      if (typeof scalar === "boolean") return scalar;
      if (scalar === 1 || scalar === "true") return true;
      if (scalar === 0 || scalar === "false") return false;
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
