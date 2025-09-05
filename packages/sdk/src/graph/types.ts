import { MultiGraph } from "graphology";
import { Attributes, SerializedGraph } from "graphology-types";
import { DateTime } from "luxon";

/**
 * BASE TYPES:
 * ***********
 */

export type Scalar = boolean | number | string | undefined | null;
export const SCALAR_TYPES = new Set(["boolean", "number", "string", "undefined"]);

export type ItemType = "nodes" | "edges";
export const ITEM_TYPES: ItemType[] = ["nodes", "edges"];
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

export interface NodeCoordinates {
  x: number;
  y: number;
}

export type NodeRenderingData = Attributes &
  NodeCoordinates & {
    label?: string | null;
    color?: string;
    size?: number;
    rawSize?: number;
    image?: string | null;
    fixed?: boolean;
  };

export interface GraphMetadata {
  title?: string;
  description?: string;
}

/**
 * MODEL:
 * ******
 */

/**
 * Describes how Gephi Lite should interpret a nodes or edges field.
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
export type FieldModelAbstraction = {
  text: {
    expectedOutput: string;
    options: {};
  };
  boolean: {
    expectedOutput: boolean;
    options: {};
  };
  url: {
    expectedOutput: string;
    options: {};
  };
  number: {
    expectedOutput: number;
    options: {};
  };
  category: {
    expectedOutput: string;
    options: {};
  };
  keywords: {
    expectedOutput: string[];
    options: {
      separator: string;
    };
  };
  date: {
    expectedOutput: DateTime<true>;
    options: {
      format: string;
    };
  };
  color: {
    expectedOutput: string;
    options: {};
  };
};
export type FieldModelType = keyof FieldModelAbstraction;

type FieldModelTypeSpecGeneric<K extends FieldModelType = FieldModelType> = {
  type: K;
} & FieldModelAbstraction[K]["options"];

export type FieldModelTypeSpecCollection = {
  [K in FieldModelType]: FieldModelTypeSpecGeneric<K>;
};
export type FieldModelTypeSpec = FieldModelTypeSpecCollection[keyof FieldModelAbstraction];

export type FieldModel<
  T extends ItemType = ItemType,
  Dynamic extends boolean = false,
  K extends FieldModelType = FieldModelType,
> = {
  id: string;
  itemType: T;
  label?: string;
  dynamic?: Dynamic;
} & FieldModelTypeSpecCollection[K];

export type FieldModelWithStats<T extends ItemType = ItemType> = FieldModel<T> & {
  stats: {
    nbItems: number;
    nbCastIssues: number;
    nbMissingValues: number;
  };
};

export type ModelValueType = FieldModelAbstraction[FieldModelType]["expectedOutput"] | undefined;

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
  // The rest of nodes and edges attributes are stored in separate indices:
  edgeData: Record<string, ItemData>;
  nodeData: Record<string, ItemData>;
  layout: Record<string, NodeCoordinates>;

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
  i18nKey: string;
  field: FieldModel<IT, true>;
  compute: (id: string, graph: DatalessGraph) => Scalar;
  showInDataTable: boolean | ((graph: DatalessGraph) => boolean);
  editable?: boolean;
};
export type DynamicItemsDataSpec<N_T extends string, E_T extends string> = {
  nodes: Record<N_T, DynamicItemDataSpec<"nodes">>;
  edges: Record<E_T, DynamicItemDataSpec<"edges">>;
};
