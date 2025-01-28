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

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
