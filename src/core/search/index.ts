import MiniSearch from "minisearch";

import { atom } from "../utils/atoms";
import { graphDatasetAtom } from "../graph";
import { SearchState } from "./types";
import { getEmptySearchState, nodeToDocument, edgeToDocument } from "./utils";
import { Producer, producerToAction } from "../utils/reducers";
import { ItemType } from "../types";

/**
 * Producers:
 * **********
 */
export const indexAll: Producer<SearchState, []> = () => {
  const graphDataset = graphDatasetAtom.get();
  const index = new MiniSearch({
    idField: "itemId",
    fields: [
      "label",
      ...graphDataset.nodeFields.filter((f) => f.qualitative).map((f) => f.id),
      ...graphDataset.edgeFields.filter((f) => f.quantitative).map((f) => f.id),
    ],
    storeFields: ["itemId", "id", "type"],
    processTerm: (term, _fieldName) =>
      term
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
  });

  index.addAll(Object.keys(graphDataset.nodeData).map((id) => nodeToDocument(graphDataset, id)));
  index.addAll(Object.keys(graphDataset.edgeData).map((id) => edgeToDocument(graphDataset, id)));

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

export const nodeIndex: Producer<SearchState, [string]> = (id) => {
  return (state) => {
    const graphDataset = graphDatasetAtom.get();
    const data = nodeToDocument(graphDataset, id);
    if (state.index.has(`nodes-${id}`)) {
      state.index.replace(data);
    } else {
      state.index.add(data);
    }
    return state;
  };
};

export const edgeIndex: Producer<SearchState, [string]> = (id) => {
  return (state) => {
    const graphDataset = graphDatasetAtom.get();
    const data = edgeToDocument(graphDataset, id);
    if (state.index.has(`edges-${id}`)) {
      state.index.replace(data);
    } else {
      state.index.add(data);
    }
    return state;
  };
};

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
  edgeRemove: producerToAction(edgeRemove, searchAtom),
  edgeIndex: producerToAction(edgeIndex, searchAtom),
  itemsRemove: producerToAction(itemsRemove, searchAtom),
  reset: producerToAction(reset, searchAtom),
} as const;
