import { ItemType } from "@gephi/gephi-lite-sdk";
import { mapKeys } from "lodash";
import MiniSearch from "minisearch";

import { GraphDataset, SigmaGraph } from "../graph/types";
import { Document, SearchState } from "./types";

export function getEmptySearchState(): SearchState {
  return {
    index: new MiniSearch({ fields: [] }),
  };
}

export function getItemLabel(itemType: ItemType, id: string, graph: SigmaGraph): string | undefined {
  if (itemType === "nodes" ? !graph.hasNode(id) : !graph.hasEdge(id)) return undefined;

  return (
    (itemType === "nodes" ? graph.getNodeAttribute(id, "label") : graph.getEdgeAttribute(id, "label")) ?? undefined
  );
}

export function nodeToDocument(graphDataset: GraphDataset, graph: SigmaGraph, id: string): Document {
  return {
    itemId: `nodes-${id}`,
    type: "nodes",
    id,
    label: getItemLabel("nodes", id, graph),
    // to avoid collision with our internal data, we prefix properties
    // TODO: should we cast scalar to modelvalue ?
    ...mapKeys(graphDataset.nodeData[id], (_value, key) => `prop_${key}`),
  };
}

export function edgeToDocument(graphDataset: GraphDataset, graph: SigmaGraph, id: string): Document {
  return {
    itemId: `edges-${id}`,
    type: "edges",
    id,
    label: getItemLabel("edges", id, graph),
    // to avoid collision with our internal data, we prefix properties
    ...mapKeys(graphDataset.edgeData[id], (_value, key) => `prop_${key}`),
  };
}
