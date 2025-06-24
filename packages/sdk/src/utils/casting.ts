import { DateTime } from "luxon";

import { SCALAR_TYPES, Scalar } from "../graph";

export function toScalar(o: unknown): Scalar {
  if (SCALAR_TYPES.has(typeof o)) return o as Scalar;

  // some special cases
  if (o instanceof Date) return o.toString();
  if (o instanceof Object) return JSON.stringify(o);

  if (o === null) return undefined;
  // fallback to toString
  return `${o}`;
}

export function toNumber(o: unknown): number | undefined {
  if (typeof o === "number" && !isNaN(o)) return o;
  if (typeof o === "string") {
    const n = +o;
    if (!isNaN(n)) return n;
  }

  return undefined;
}

export function toString(o: Scalar): string | undefined {
  if (typeof o === "string") return o;
  if (typeof o === "number") return o + "";
  if (typeof o === "boolean") return o.toString();
  return undefined;
}

export function toStringArray(o: Scalar, separator: string): string[] | undefined {
  const oAsString = toString(o);
  if (oAsString) return oAsString.split(separator);
  return undefined;
}

export function toDate(o: Scalar, format?: string): DateTime | undefined {
  const oAsString = toString(o);
  if (oAsString) {
    try {
      if (format) {
        const d = DateTime.fromFormat(oAsString, format);
        return d.isValid ? d : undefined;
      } else {
        const d = DateTime.fromISO(oAsString);
        return d.isValid ? d : undefined;
      }
    } catch (error) {
      if (error instanceof RangeError) return undefined;
      else throw error;
    }
  }

  return undefined;
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
