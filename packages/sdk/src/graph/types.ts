import { Attributes, GraphType } from "graphology-types";

/**
 * Base types:
 * ***********
 */
export type Scalar = boolean | number | string | undefined | null;
export const SCALAR_TYPES = new Set(["boolean", "number", "string", "undefined"]);

export type ItemType = "nodes" | "edges";
export type ItemData = Record<string, Scalar>;

/**
 * Items data:
 * ***********
 */
export interface EdgeRenderingData extends Attributes {
  label?: string | null;
  color?: string;
  weight?: number;
  rawWeight?: number;
}

export interface NodeRenderingData extends Attributes {
  label?: string | null;
  color?: string;
  size?: number;
  x: number;
  y: number;
  rawSize?: number;
  image?: string | null;
  fixed?: boolean;
}

export interface GraphMetadata {
  title?: string;
  description?: string;
  authors?: string;
  keywords?: string;
  type: GraphType;
}

/**
 * Model:
 * ******
 */
export interface FieldModel<T extends ItemType = ItemType> {
  id: string;
  itemType: T;
  quantitative: null | { unit?: string | null };
  qualitative: null | { separator?: string | null };
}

export type FieldModelWithStats<T extends ItemType = ItemType> = FieldModel<T> & {
  stats: {
    nbItems: number;
    nbCastIssues: number;
    nbMissingValues: number;
  };
};
