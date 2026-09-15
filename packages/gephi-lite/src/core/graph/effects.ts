import {
  APPEARANCE_ITEM_TYPES,
  AppearanceState,
  FilterType,
  FilteredGraph,
  GraphDataset,
  datasetToString,
  getEmptyAppearanceState,
} from "@gephi/gephi-lite-sdk";
import { forEach, isString, keys, omitBy } from "lodash";

import { getPalette } from "../../components/GraphAppearance/color/utils";
import { appearanceAtom } from "../appearance";
import { filtersAtom } from "../filters";
import { applyFilters } from "../filters/utils";
import { searchActions } from "../search";
import { topologicalFiltersAtom } from "./atom";
import { filteredGraphsAtom, graphDatasetAtom } from "./atom";
import { uniqFieldValuesAsStrings } from "./utils";

graphDatasetAtom.bind((graphDataset, previousGraphDataset) => {
  const updatedKeys = new Set(
    (Object.keys(graphDataset) as (keyof GraphDataset)[]).filter(
      (key) => graphDataset[key] !== previousGraphDataset[key],
    ),
  );

  // When the fullGraph ref changes, reindex everything:
  if (updatedKeys.has("fullGraph") || updatedKeys.has("layout")) {
    const filtersState = filtersAtom.get();
    const newCache = applyFilters(graphDataset, filtersState.filters, [], topologicalFiltersAtom.get());
    filteredGraphsAtom.set(newCache);
  }

  // When graph data or fields changed, we reindex it for the search
  if (updatedKeys.has("fullGraph") || updatedKeys.has("edgeFields") || updatedKeys.has("nodeFields")) {
    searchActions.indexAll();
  }

  // When fields changed, check if filter or appearance use it
  // here we test only static field
  if (updatedKeys.has("edgeFields") || updatedKeys.has("nodeFields")) {
    const nodeFields = graphDataset.nodeFields.map((nf) => nf.id);
    const edgeFields = graphDataset.edgeFields.map((nf) => nf.id);

    // filters
    const filtersState = filtersAtom.get();
    const filterFilters = (f: FilterType) =>
      // here we test only static field
      !("field" in f) || f.field === undefined || nodeFields.includes(f.field.id) || edgeFields.includes(f.field.id);
    filtersAtom.set({
      filters: filtersState.filters.filter(filterFilters),
    });
    // appearance
    const appearanceState = appearanceAtom.get();
    const initialState = getEmptyAppearanceState();

    const newState = {
      ...initialState,
      ...omitBy(appearanceState, (appearanceElement, key: keyof AppearanceState) => {
        if (
          appearanceElement &&
          !isString(appearanceElement) &&
          "field" in appearanceElement &&
          appearanceElement.field &&
          // here we test only static field
          !appearanceElement.field.dynamic &&
          ((APPEARANCE_ITEM_TYPES[key] === "edges" && !edgeFields.includes(appearanceElement.field.id)) ||
            (APPEARANCE_ITEM_TYPES[key] === "nodes" && !nodeFields.includes(appearanceElement.field.id)))
        ) {
          // this appearance element is based on a field which is not in the model anymore
          // let's reset it
          return true;
        }

        // this appearance is not based on a field or on a field existing in the model
        return false;
      }),
    };

    // to keep appearance state in sync we must check at least partitions
    forEach(newState, (appearanceElement, key: keyof AppearanceState) => {
      if (
        !appearanceElement ||
        isString(appearanceElement) ||
        !("type" in appearanceElement) ||
        !("field" in appearanceElement)
      )
        return appearanceElement;
      // TODO
      // - check if data field quali/quanti is still the good one

      // utils variables
      const itemsData = graphDataset[APPEARANCE_ITEM_TYPES[key] === "nodes" ? "nodeData" : "edgeData"];
      let values: string[] = [];

      switch (appearanceElement.type) {
        // - if partitions palette are still in sync with the field values
        case "partition":
          // check if deprecated appearance state
          values = uniqFieldValuesAsStrings(itemsData, appearanceElement.field.id);

          // checking with the actual palette miss some values. It's ok if it has more available.
          if (
            keys(appearanceElement.colorPalette).length < values.length ||
            values.some((v) => appearanceElement.colorPalette[v] === undefined)
          ) {
            // new palette
            // TODO: merge existing palette with the new values, i.e. keep existing colors
            appearanceElement.colorPalette = getPalette(values);
          }
          break;
        // nothing to do for other cases
        // TODO: check if other cases need edits.
      }
    });

    appearanceAtom.set(newState);
  }

  // Only "small enough" graphs are stored in the sessionStorage, because this
  // feature only helps to resist page reloads, basically:
  if (graphDataset.fullGraph.order < 5000 && graphDataset.fullGraph.size < 25000) {
    try {
      sessionStorage.setItem("dataset", datasetToString(graphDataset));
    } catch (_e) {
      // nothing todo
    }
  }
});

filtersAtom.bind((filtersState) => {
  // TODO: Restore cache management when disabling/enabling filters:
  // const cache = filteredGraphsAtom.get();
  const cache: FilteredGraph[] = [];
  const dataset = graphDatasetAtom.get();

  const newCache = applyFilters(dataset, filtersState.filters, cache, topologicalFiltersAtom.get());
  filteredGraphsAtom.set(newCache);
});
