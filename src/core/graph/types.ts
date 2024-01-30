import { MultiGraph } from "graphology";
import { GraphType } from "graphology-types";

import { ItemType, Scalar } from "../types";
import { CloudFile } from "../cloud/types";

/**
 * Graph origin:
 * *************
 */
export interface GraphFile {
  type: string;
  filename: string;
}
export interface RemoteFile extends GraphFile {
  type: "remote";
  url: string;
}
export interface LocalFile extends GraphFile {
  type: "local";
  updatedAt: Date;
  size: number;
  source: File;
}
export type GraphOrigin = CloudFile | RemoteFile | LocalFile | null;

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
export interface EdgeRenderingData {
  label?: string | null;
  color?: string;
  weight?: number;
  rawWeight?: number;
}
export interface NodeRenderingData {
  label?: string | null;
  color?: string;
  size?: number;
  x: number;
  y: number;
  rawSize?: number;
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

/**
 * Graphs:
 * *******
 */
export type DatalessGraph = MultiGraph<{}, {}>;
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

  // Origin of the current graph
  // Ex: is it a local or a remote file
  origin: GraphOrigin;
}
export type FileState = { type: "idle" } | { type: "loading" } | { type: "error"; message?: string };
