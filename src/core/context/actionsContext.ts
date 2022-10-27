import { createContext } from "react";

import { producerToAction } from "../utils/reducers";
import { filtersAtom, filtersProducers } from "../filters";
import { graphDatasetAtom, graphDatasetProducers } from "../graph";

export const actionsContextValue = {
  // Filters management:
  addFilter: producerToAction(filtersProducers.addFilter, filtersAtom),
  resetFilters: producerToAction(filtersProducers.resetFilters, filtersAtom),
  openPastFilter: producerToAction(filtersProducers.openPastFilter, filtersAtom),
  openFutureFilter: producerToAction(filtersProducers.openFutureFilter, filtersAtom),
  deleteCurrentFilter: producerToAction(filtersProducers.deleteCurrentFilter, filtersAtom),

  // Graph dataset management:
  setGraphMeta: producerToAction(graphDatasetProducers.setGraphMeta, graphDatasetAtom),
  editGraphMeta: producerToAction(graphDatasetProducers.editGraphMeta, graphDatasetAtom),
};

export const actionsContext = createContext(actionsContextValue);
