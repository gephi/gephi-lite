import { EdgeRenderingData, FieldModel, GraphMetadata, ItemData, NodeRenderingData } from "@gephi/gephi-lite-sdk";
import { MultiGraph } from "graphology";
import { Attributes } from "graphology-types";
import Sigma from "sigma";

import { GraphOrigin } from "./import/types";

export {
  type EdgeRenderingData,
  type FieldModel,
  type GraphMetadata,
  type NodeRenderingData,
  type FieldModelWithStats,
  type ItemData,
} from "@gephi/gephi-lite-sdk";

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
