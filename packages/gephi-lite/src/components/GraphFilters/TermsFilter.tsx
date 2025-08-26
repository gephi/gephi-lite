import { countBy, flatMap, identity, sortBy, toPairs } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { TermsFilterType } from "../../core/filters/types";
import { useFilteredGraphAt } from "../../core/graph";
import { computeAllDynamicAttributes, mergeStaticDynamicData } from "../../core/graph/dynamicAttributes";
import { getFieldValue } from "../../core/graph/fieldModel";
import { Select } from "../forms/Select";

export const TermsFilter: FC<{ filter: TermsFilterType; filterIndex: number }> = ({ filter, filterIndex }) => {
  const parentGraph = useFilteredGraphAt(filterIndex);
  const { nodeData, edgeData } = useGraphDataset();

  const { t } = useTranslation();
  const { updateFilter } = useFiltersActions();
  const [dataTerms, setDataTerms] = useState<Record<string, number>>({});

  useEffect(() => {
    const itemData = mergeStaticDynamicData(
      filter.itemType === "nodes" ? nodeData : edgeData,
      // dynamic field should be calculated from parent graph and not from the useDynamicItemData which provide data in the current graph
      filter.itemType === "nodes"
        ? computeAllDynamicAttributes("nodes", parentGraph)
        : computeAllDynamicAttributes("edges", parentGraph),
    );
    const terms = countBy(
      flatMap(filter.itemType === "nodes" ? parentGraph.nodes() : parentGraph.edges(), (itemId) =>
        getFieldValue(itemData[itemId], filter.field),
      ).filter((v) => typeof v === "string"),
      identity,
    );
    setDataTerms(terms);
  }, [filter, parentGraph, nodeData, edgeData]);

  return (
    <div className="w-100">
      <Select
        autoFocus
        value={filter.terms ? Array.from(filter.terms).map((t) => ({ label: t, value: t })) : []}
        onChange={(options) => {
          const selectedValues = new Set(options.map((o) => o.value));
          updateFilter(filterIndex, { ...filter, terms: selectedValues.size > 0 ? selectedValues : undefined });
        }}
        isMulti
        options={sortBy(toPairs(dataTerms), ([_term, nbOcc]) => -1 * nbOcc).map(([term, nbOcc]) => ({
          label: `${term} (${nbOcc} ${t(`graph.model.${filter.itemType}`)})`,
          value: term,
        }))}
      />
      <div>
        <input
          className="form-check-input me-2"
          type="checkbox"
          id="keepMissingValues"
          checked={!!filter.keepMissingValues}
          onChange={(e) => {
            updateFilter(filterIndex, { ...filter, keepMissingValues: e.target.checked });
          }}
        />
        <label className="from-check-label small" htmlFor="keepMissingValues">
          {t("filters.keepMissingValues")}
        </label>
      </div>
    </div>
  );
};
