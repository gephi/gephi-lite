import { MultiGraph } from "graphology";
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
export interface LocalFile extends GraphFile, File {
  type: "local";
  updatedAt: Date;
  size: number;
}
export type GraphOrigin = CloudFile | RemoteFile | LocalFile | null;

/**
 * Items data:
 * ***********
 */
export interface EdgeRenderingData {
  label?: string;
  size?: number;
  color?: string;
}
export interface NodeRenderingData {
  label?: string;
  color?: string;
  size?: number;
  x: number;
  y: number;
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
  metadata: Record<string, any>;

  // We store here how the nodes/edges attributes should be interpretated:
  nodeFields: FieldModel<"nodes">[];
  edgeFields: FieldModel<"edges">[];

  // Finally, we store here a Graphology instance that stores the graph, without
  // nodes and edges data - just for traversal:
  fullGraph: DatalessGraph;

  // Origin of the current graph
  // Ex: is it a local or a remote file
  origin: GraphOrigin;
}
