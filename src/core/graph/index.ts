import { omit } from "lodash";

import { atom } from "../utils/atoms";
import { FieldModel, GraphDataset, SigmaGraph } from "./types";
import { Producer } from "../utils/reducers";
import { dataGraphToSigmaGraph, getEmptyGraphDataset } from "./utils";
import { filtersAtom } from "../filters";
import { datasetToFilteredSigmaGraph } from "../filters/utils";

/**
 * Producers:
 * **********
 */
const setGraphMeta: Producer<GraphDataset, [GraphDataset["metadata"]]> = (metadata) => {
  return (state) => ({
    ...state,
    metadata,
  });
};
const editGraphMeta: Producer<GraphDataset, [string, any]> = (key, value) => {
  return (state) => ({
    ...state,
    metadata: value === undefined ? omit(state.metadata, key) : { ...state.metadata, [key]: value },
  });
};
const setFieldModel: Producer<GraphDataset, [FieldModel]> = (fieldModel) => {
  const key = fieldModel.itemType === "nodes" ? "nodeFields" : "edgeFields";

  return (state) => ({
    ...state,
    [key]: state[key].map((field) => (field.id === fieldModel.id ? fieldModel : field)),
  });
};

export const graphDatasetProducers = {
  setGraphMeta,
  editGraphMeta,
  setFieldModel,
};

/**
 * Public API:
 * ***********
 */
export const graphDatasetAtom = atom<GraphDataset>(getEmptyGraphDataset());
export const sigmaGraphAtom = atom<SigmaGraph>(dataGraphToSigmaGraph(graphDatasetAtom.get()));

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
    const filtersState = filtersAtom.get();

    sigmaGraphAtom.set(datasetToFilteredSigmaGraph(graphDataset, filtersState.past));
    return;
  }

  // TODO:
  // Refresh sigmaGraph when `nodeRenderingData` or `edgeRenderingData` is updated
});

filtersAtom.bind((filtersState) => {
  const graphDataset = graphDatasetAtom.get();

  sigmaGraphAtom.set(datasetToFilteredSigmaGraph(graphDataset, filtersState.past));
});
