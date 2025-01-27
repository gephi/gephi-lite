import { MultiGraph } from "graphology";
import { Attributes, GraphType } from "graphology-types";
import Sigma from "sigma";

import { ItemType, Scalar } from "../types";
import { GraphOrigin } from "./import/types";

export interface GraphMetadata {
  title?: string;
  description?: string;
  authors?: string;
  keywords?: string;
  type: GraphType;
}

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

// At the moment, all other attributes must be stored as scalar values, for
// maintainability and performance reasons:
export type ItemData = Record<string, Scalar>;

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

export type GephiLiteSigma = Sigma<NodeRenderingData, EdgeRenderingData, Attributes>;

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

  // Origin of the current graph
  // Ex: is it a local or a remote file
  origin: GraphOrigin;
}
