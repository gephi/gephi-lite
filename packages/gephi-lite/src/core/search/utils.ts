import { mapKeys } from "lodash";
import MiniSearch from "minisearch";

import { GraphDataset, SigmaGraph } from "../graph/types";
import { Document, SearchState } from "./types";

export function getEmptySearchState(): SearchState {
  return {
    index: new MiniSearch({ fields: [] }),
  };
}

export function nodeToDocument(graphDataset: GraphDataset, _graph: SigmaGraph, id: string): Document {
  return {
    itemId: `nodes-${id}`,
    type: "nodes",
    id,
    ...mapKeys(graphDataset.nodeData[id], (_value, key) => `prop_node_${key}`),
  };
}

export function edgeToDocument(graphDataset: GraphDataset, _graph: SigmaGraph, id: string): Document {
  return {
    itemId: `edges-${id}`,
    type: "edges",
    id,
    ...mapKeys(graphDataset.edgeData[id], (_value, key) => `prop_edge_${key}`),
  };
}
