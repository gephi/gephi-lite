import { atom } from "../utils/atoms";
import { GraphDataset, SigmaGraph } from "./types";
import { dataGraphToSigmaGraph, getEmptyGraphDataset } from "./utils";

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
graphDatasetAtom.bind((graphDataset) => {
  sigmaGraphAtom.set(dataGraphToSigmaGraph(graphDataset));
});
