import { createContext } from "react";

import { filtersAtom } from "../filters";
import { graphDatasetAtom, sigmaGraphAtom } from "../graph";
import { makeUseAtom, makeUseReadAtom, makeUseWriteAtom } from "../utils/atoms";

export const dataContextValue = {
  graphDataset: makeUseAtom(graphDatasetAtom),
  readGraphDataset: makeUseReadAtom(graphDatasetAtom),
  writeGraphDataset: makeUseWriteAtom(graphDatasetAtom),

  sigmaGraph: makeUseAtom(sigmaGraphAtom),
  readSigmaGraph: makeUseReadAtom(sigmaGraphAtom),
  writeSigmaGraph: makeUseWriteAtom(sigmaGraphAtom),

  filters: makeUseAtom(filtersAtom),
  readFilters: makeUseReadAtom(filtersAtom),
  writeFilters: makeUseWriteAtom(filtersAtom),
};

export const dataContext = createContext(dataContextValue);
