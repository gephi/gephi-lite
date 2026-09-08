import { ItemType } from "@gephi/gephi-lite-sdk";
import { useMemo } from "react";

import { useGraphDataset } from "../../core/context/dataContexts";
import { useFilteredGraphAt } from "../../core/graph";
import { mergeStaticDynamicData } from "../../core/graph/dynamicAttributes";
import { computeAllComputedAttributes } from "../../core/graph/utils";

/**
 * Everything a filter's own UI needs to describe the values it can act on: the graph it applies to
 * (the one produced by the filters above it, not the fully filtered one), and the attribute values
 * of its items - stored ones as well as computed ones (dynamic and formula fields), which have to be
 * evaluated on that very graph.
 *
 * Shared by every filter UI that summarizes values (histogram, term list...), so they all describe
 * exactly what `filterGraph` will then keep or drop.
 */
export function useFilterItemData(itemType: ItemType, filterIndex: number) {
  const dataset = useGraphDataset();
  const parentGraph = useFilteredGraphAt(filterIndex - 1);

  const itemData = useMemo(
    () =>
      mergeStaticDynamicData(
        itemType === "nodes" ? dataset.nodeData : dataset.edgeData,
        computeAllComputedAttributes(itemType, dataset, parentGraph),
      ),
    [dataset, itemType, parentGraph],
  );

  return { parentGraph, itemData };
}
