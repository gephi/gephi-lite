import { MultiGraph } from 'graphology';
import { Scalar } from '../types';

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
export interface AttributeDefinition {
  id: string;
  isQuali: boolean;
  isQuanti: boolean;
}

/**
 * Graphs:
 * *******
 */
export type DatalessGraph = MultiGraph<{}, {}>;
export type SigmaGraph = MultiGraph<NodeRenderingData, EdgeRenderingData>;

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
  metadata: Record<string, string>;

  // Finally, we store here a Graphology instance that stores the graph, without
  // nodes and edges data - just for traversal:
  fullGraph: DatalessGraph;
}

export interface GraphModel {
  edgeAttributes: Record<string, AttributeDefinition>;
  nodeAttributes: Record<string, AttributeDefinition>;
}
