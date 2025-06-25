import { MultiGraph } from "graphology";
import { Attributes, GraphType, SerializedGraph } from "graphology-types";
import { DateTime } from "luxon";

/**
 * BASE TYPES:
 * ***********
 */

export type Scalar = boolean | number | string | undefined | null;
export const SCALAR_TYPES = new Set(["boolean", "number", "string", "undefined"]);

export type ModelValueType = string | string[] | DateTime | number | undefined;

export type ItemType = "nodes" | "edges";
export type ItemData = Record<string, Scalar>;
export type StaticDynamicItemData = { static: ItemData; dynamic: ItemData };

/**
 * ITEMS DATA:
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
 * MODEL:
 * ******
 */

/**
 * Describes how Gephi Lite should interpret a nodes or edges field.
 */

export type FieldModelTypeSpec =
  | { type: "text" } // Textual content "unique" i.e. suitable for reading not for filtering neither for appearance
  | { type: "number" } // Quantifiable values suitable for ranking appearance and filtering by range
  | { type: "category" } // Terms regrouping many items suitable for partition appearance and select filtering
  | { type: "keywords"; separator: string } // multiple terms for one items suitable for select filtering, can't be used for appearance
  | { type: "date"; format?: string }; // if no format Gephi Lite will write ISOString.

export type FieldModelType = FieldModelTypeSpec["type"];

export type FieldModel<T extends ItemType = ItemType, Dynamic extends boolean = false> = {
  id: string;
  itemType: T;
  dynamic?: Dynamic;
} & FieldModelTypeSpec;

export type FieldModelWithStats<T extends ItemType = ItemType> = FieldModel<T> & {
  stats: {
    nbItems: number;
    nbCastIssues: number;
    nbMissingValues: number;
  };
};

/**
 * GRAPHS:
 * *******
 */

/**
 * A Graphology graph, without any attribute, to just describe the topology of a graph.
 */
export type DatalessGraph = MultiGraph;
export type SigmaGraph = MultiGraph<NodeRenderingData, EdgeRenderingData>;
export type DataGraph = MultiGraph<ItemData, ItemData>;
export type FullGraph = MultiGraph<ItemData & NodeRenderingData, ItemData & EdgeRenderingData>;

/**
 * STATES:
 * *******
 */

/**
 * A canonical structure that contains the topology of a graph, its nodes and edges attributes and rendering attributes,
 * as well as the models to know how to interpret all the attributes.
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

// Dynamic data for nodes which are recomputed from topology (like degree)
export interface DynamicItemData {
  dynamicNodeData: Record<string, Record<string, Scalar>>;
  dynamicNodeFields: FieldModel<"nodes", true>[];
  dynamicEdgeData: Record<string, Record<string, Scalar>>;
  dynamicEdgeFields: FieldModel<"edges", true>[];
}

export type DynamicItemDataSpec<IT extends ItemType> = {
  field: FieldModel<IT, true>;
  compute: (id: string, graph: DatalessGraph) => Scalar;
};
export type DynamicItemsDataSpec = {
  nodes: DynamicItemDataSpec<"nodes">[];
  edges: DynamicItemDataSpec<"edges">[];
};
