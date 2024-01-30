import { SCALAR_TYPES, Scalar } from "../types";

export function toScalar(o: unknown): Scalar {
  if (SCALAR_TYPES.has(typeof o)) return o as Scalar;
  if (o === null) return undefined;
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

export function toString(o: unknown): string | undefined {
  if (typeof o === "string") return o;
  if (typeof o === "number") return o + "";

  return undefined;
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
