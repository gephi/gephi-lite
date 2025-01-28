export type ItemType = "nodes" | "edges";

export type Scalar = boolean | number | string | undefined | null;
export const SCALAR_TYPES = new Set(["boolean", "number", "string", "undefined"]);

export type ItemData = Record<string, Scalar>;
