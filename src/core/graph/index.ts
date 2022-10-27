import { omit } from "lodash";

import { atom } from "../utils/atoms";
import { GraphDataset, SigmaGraph } from "./types";
import { Producer, producerToAction } from "../utils/reducers";
import { dataGraphToSigmaGraph, getEmptyGraphDataset } from "./utils";

/**
 * Producers:
 * **********
 */
const setGraphMetaProducer: Producer<GraphDataset, [GraphDataset["metadata"]]> = (metadata) => {
  return (state) => ({
    ...state,
    metadata,
  });
};
const editGraphMetaProducer: Producer<GraphDataset, [string, any]> = (key, value) => {
  return (state) => ({
    ...state,
    metadata: value === undefined ? omit(state.metadata, key) : { ...state.metadata, [key]: value },
  });
};

export const graphDatasetProducers = {
  setGraphMetaProducer,
  editGraphMetaProducer,
};

/**
 * Public API:
 * ***********
 */
export const graphDatasetAtom = atom<GraphDataset>(getEmptyGraphDataset());

export const sigmaGraphAtom = atom<SigmaGraph>(dataGraphToSigmaGraph(graphDatasetAtom.get()));

export const setGraphMeta = producerToAction(setGraphMetaProducer, graphDatasetAtom);
export const editGraphMeta = producerToAction(editGraphMetaProducer, graphDatasetAtom);

/**
 * Bindings:
 * *********
 */
graphDatasetAtom.bind((graphDataset, previousGraphDataset) => {
  const updatedKeys = new Set(
    (Object.keys(graphDataset) as (keyof GraphDataset)[]).filter(
      (key) => graphDataset[key] !== previousGraphDataset[key],
    ),
  );

  // When the fullGraph ref changes, reindex everything:
  if (updatedKeys.has("fullGraph")) {
    sigmaGraphAtom.set(dataGraphToSigmaGraph(graphDataset));
    return;
  }

  // TODO:
  // Refresh sigmaGraph when `nodeRenderingData` or `edgeRenderingData` is updated
});
