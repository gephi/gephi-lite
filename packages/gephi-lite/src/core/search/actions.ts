import { FieldModelType, ItemType } from "@gephi/gephi-lite-sdk";
import { Producer, producerToAction } from "@ouestware/atoms";
import MiniSearch from "minisearch";

import { graphDatasetAtom, sigmaGraphAtom } from "../graph/atom";
import { searchAtom } from "./atom";
import { SearchState } from "./types";
import { edgeToDocument, getEmptySearchState, nodeToDocument } from "./utils";

const indexAll: Producer<SearchState, []> = () => {
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

const nodeRemove: Producer<SearchState, [string]> = (id) => {
  return (state) => {
    if (state.index.has(`nodes-${id}`)) {
      state.index.discard(`nodes-${id}`);
    }
    return state;
  };
};

const edgeRemove: Producer<SearchState, [string]> = (id) => {
  return (state) => {
    if (state.index.has(`edges-${id}`)) {
      state.index.discard(`edges-${id}`);
    }
    return state;
  };
};

// Keep the export, it is used in graph within a MultProducer
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

// Keep the export, it is used in graph within a MultProducer
export const itemsIndex: Producer<SearchState, [ItemType, string[]]> = (type, ids) => {
  return type === "edges" ? edgesIndex(ids) : nodesIndex(ids);
};

const nodesIndex: Producer<SearchState, [string[]]> = (ids) => {
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

// Keep the export, it is used in graph within a MultProducer
export const nodeIndex: Producer<SearchState, [string]> = (id) => nodesIndex([id]);

const edgesIndex: Producer<SearchState, [string[]]> = (ids) => {
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

// Keep the export, it is used in graph within a MultProducer
export const edgeIndex: Producer<SearchState, [string]> = (id) => edgesIndex([id]);

const reset: Producer<SearchState, []> = () => {
  return () => getEmptySearchState();
};

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
