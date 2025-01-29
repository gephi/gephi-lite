import { MultiGraph } from "graphology";
import { Attributes, GraphType, SerializedGraph } from "graphology-types";

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

/**
 * Graphs:
 * *******
 */
export type DatalessGraph = MultiGraph;
export type SigmaGraph = MultiGraph<NodeRenderingData, EdgeRenderingData>;
export type DataGraph = MultiGraph<ItemData, ItemData>;
export type FullGraph = MultiGraph<ItemData & NodeRenderingData, ItemData & EdgeRenderingData>;

/**
 * States:
 * *******
 */
export interface GraphDataset {
  // The mandatory rendering data is stored in typed indices:
  nodeRenderingData: Record<string, NodeRenderingData>;
  edgeRenderingData: Record<string, EdgeRenderingData>;

  // The rest of nodes and edges attributes are stored in separate indices:
  nodeData: Record<string, ItemData>;
  edgeData: Record<string, ItemData>;

  // We store here the graph metadata (title, author, etc...):
  metadata: GraphMetadata;

  // We store here how the nodes/edges attributes should be interpreted:
  nodeFields: FieldModel<"nodes">[];
  edgeFields: FieldModel<"edges">[];

  // Finally, we store here a Graphology instance that stores the graph, without
  // nodes and edges data - just for traversal:
  fullGraph: DatalessGraph;
}
export type SerializedGraphDataset = Omit<GraphDataset, "fullGraph"> & { fullGraph: SerializedGraph };
