import { mapKeys } from "lodash";
import MiniSearch from "minisearch";

import { GraphDataset } from "../graph/types";
import { Document, SearchState } from "./types";

export function getEmptySearchState(): SearchState {
  return {
    index: new MiniSearch({ fields: [] }),
  };
}

export function nodeToDocument(graphDataset: GraphDataset, id: string): Document {
  return {
    itemId: `nodes-${id}`,
    id: id,
    type: "nodes",
    label: graphDataset.nodeRenderingData[id].label,
    // to avoid collision with our internal data, we prefix properties
    ...mapKeys(graphDataset.nodeData[id], (_value, key) => `prop_${key}`),
  };
}

export function edgeToDocument(graphDataset: GraphDataset, id: string): Document {
  return {
    itemId: `edges-${id}`,
    id: id,
    type: "edges",
    label: graphDataset.edgeRenderingData[id].label,
    // to avoid collision with our internal data, we prefix properties
    ...mapKeys(graphDataset.edgeData[id], (_value, key) => `prop_${key}`),
  };
}
