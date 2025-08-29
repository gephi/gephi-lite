import { FieldModelType } from "@gephi/gephi-lite-sdk";
import { Producer, atom, producerToAction } from "@ouestware/atoms";
import MiniSearch from "minisearch";

import { graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { ItemType } from "../types";
import { SearchState } from "./types";
import { edgeToDocument, getEmptySearchState, nodeToDocument } from "./utils";

/**
 * Producers:
 * **********
 */
export const indexAll: Producer<SearchState, []> = () => {
  const graphDataset = graphDatasetAtom.get();
  const sigmaGraph = sigmaGraphAtom.get();
  const searchableModelFieldTypes: FieldModelType[] = ["category", "keywords", "text"];
  const index = new MiniSearch({
    idField: "itemId",
    fields: [
      "id",
      ...graphDataset.nodeFields
        .filter((f) => searchableModelFieldTypes.includes(f.type))
        .map((f) => `prop_node_${f.id}`),
      ...graphDataset.edgeFields
        .filter((f) => searchableModelFieldTypes.includes(f.type))
        .map((f) => `prop_edge_${f.id}`),
    ],
    storeFields: ["itemId", "id", "type"],
    processTerm: (term, _fieldName) =>
      term
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
  });

  index.addAll(Object.keys(graphDataset.nodeData).map((id) => nodeToDocument(graphDataset, sigmaGraph, id)));
  index.addAll(Object.keys(graphDataset.edgeData).map((id) => edgeToDocument(graphDataset, sigmaGraph, id)));

  return () => ({
    index,
  });
};

export const nodeRemove: Producer<SearchState, [string]> = (id) => {
  return (state) => {
    if (state.index.has(`nodes-${id}`)) {
      state.index.discard(`nodes-${id}`);
    }
    return state;
  };
};

export const edgeRemove: Producer<SearchState, [string]> = (id) => {
  return (state) => {
    if (state.index.has(`edges-${id}`)) {
      state.index.discard(`edges-${id}`);
    }
    return state;
  };
};

export const itemsRemove: Producer<SearchState, [ItemType, string[]]> = (type, ids) => {
  return (state) => {
    ids.forEach((id) => {
      if (state.index.has(`${type}-${id}`)) {
        state.index.discard(`${type}-${id}`);
      }
    });
    return state;
  };
};

export const itemsIndex: Producer<SearchState, [ItemType, string[]]> = (type, ids) => {
  return type === "edges" ? edgesIndex(ids) : nodesIndex(ids);
};

export const nodesIndex: Producer<SearchState, [string[]]> = (ids) => {
  return (state) => {
    const graphDataset = graphDatasetAtom.get();
    const sigmaGraph = sigmaGraphAtom.get();
    for (const id of ids) {
      const data = nodeToDocument(graphDataset, sigmaGraph, id);
      if (state.index.has(`nodes-${id}`)) {
        state.index.replace(data);
      } else {
        state.index.add(data);
      }
    }
    return state;
  };
};
export const nodeIndex: Producer<SearchState, [string]> = (id) => nodesIndex([id]);

export const edgesIndex: Producer<SearchState, [string[]]> = (ids) => {
  return (state) => {
    const graphDataset = graphDatasetAtom.get();
    const sigmaGraph = sigmaGraphAtom.get();
    for (const id of ids) {
      const data = edgeToDocument(graphDataset, sigmaGraph, id);
      if (state.index.has(`edges-${id}`)) {
        state.index.replace(data);
      } else {
        state.index.add(data);
      }
    }
    return state;
  };
};
export const edgeIndex: Producer<SearchState, [string]> = (id) => edgesIndex([id]);

export const reset: Producer<SearchState, []> = () => {
  return () => getEmptySearchState();
};

/**
 * Public API:
 * ***********
 */
export const searchAtom = atom<SearchState>(getEmptySearchState());

export const searchActions = {
  indexAll: producerToAction(indexAll, searchAtom),
  nodeRemove: producerToAction(nodeRemove, searchAtom),
  nodeIndex: producerToAction(nodeIndex, searchAtom),
  nodesIndex: producerToAction(nodesIndex, searchAtom),
  edgeRemove: producerToAction(edgeRemove, searchAtom),
  edgeIndex: producerToAction(edgeIndex, searchAtom),
  edgesIndex: producerToAction(edgesIndex, searchAtom),
  itemsRemove: producerToAction(itemsRemove, searchAtom),
  itemsIndex: producerToAction(itemsIndex, searchAtom),
  reset: producerToAction(reset, searchAtom),
} as const;
