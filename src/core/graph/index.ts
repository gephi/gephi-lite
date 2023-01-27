import { omit } from "lodash";
import Sigma from "sigma";

import { atom } from "../utils/atoms";
import { filtersAtom } from "../filters";
import { FiltersState } from "../filters/types";
import { datasetToFilteredSigmaGraph } from "../filters/utils";
import { FieldModel, GraphDataset, SigmaGraph } from "./types";
import { Producer, producerToAction } from "../utils/reducers";
import { dataGraphToSigmaGraph, getEmptyGraphDataset, serializeDataset } from "./utils";

/**
 * Producers:
 * **********
 */
const setGraphDataset: Producer<GraphDataset, [GraphDataset]> = (dataset) => {
  return () => dataset;
};
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

/**
 * Public API:
 * ***********
 */
export const graphDatasetAtom = atom<GraphDataset>(getEmptyGraphDataset());
export const sigmaGraphAtom = atom<SigmaGraph>(dataGraphToSigmaGraph(graphDatasetAtom.get()));
export const sigmaAtom = atom<Sigma<SigmaGraph>>(
  new Sigma(sigmaGraphAtom.get(), document.createElement("div"), { allowInvalidContainer: true }),
);

export const graphDatasetActions = {
  setGraphMeta: producerToAction(setGraphMeta, graphDatasetAtom),
  editGraphMeta: producerToAction(editGraphMeta, graphDatasetAtom),
  setFieldModel: producerToAction(setFieldModel, graphDatasetAtom),
  setGraphDataset: producerToAction(setGraphDataset, graphDatasetAtom),
};

export function refreshSigmaGraph(dataset: GraphDataset, filters: FiltersState) {
  sigmaGraphAtom.set(datasetToFilteredSigmaGraph(dataset, filters.past));
}

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
    refreshSigmaGraph(graphDataset, filtersAtom.get());
    return;
  }

  sessionStorage.setItem("dataset", serializeDataset(graphDataset));

  // TODO:
  // Refresh sigmaGraph when `nodeRenderingData` or `edgeRenderingData` is updated
});
