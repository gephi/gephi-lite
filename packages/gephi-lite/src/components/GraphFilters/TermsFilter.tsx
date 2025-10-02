import { countBy, flatMap, identity, sortBy } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { TermsFilterType } from "../../core/filters/types";
import { useFilteredGraphAt } from "../../core/graph";
import { computeAllDynamicAttributes, mergeStaticDynamicData } from "../../core/graph/dynamicAttributes";
import { getFieldValue } from "../../core/graph/fieldModel";
import { Select } from "../forms/Select";
import { toPairsCompatibleWithSymbol } from "./utils";

const unavailableValue: unique symbol = Symbol("Not Available");

export const TermsFilter: FC<{ filter: TermsFilterType; filterIndex: number }> = ({ filter, filterIndex }) => {
  const parentGraph = useFilteredGraphAt(filterIndex - 1);
  const { nodeData, edgeData } = useGraphDataset();

  const { t } = useTranslation();
  const { updateFilter } = useFiltersActions();
  const [dataTerms, setDataTerms] = useState<Record<string | typeof unavailableValue, number>>({
    [unavailableValue]: 0,
  });

  useEffect(() => {
    const itemData = mergeStaticDynamicData(
      filter.itemType === "nodes" ? nodeData : edgeData,
      // dynamic field should be calculated from parent graph and not from the useDynamicItemData which provide data in the current graph
      filter.itemType === "nodes"
        ? computeAllDynamicAttributes("nodes", parentGraph)
        : computeAllDynamicAttributes("edges", parentGraph),
    );
    const terms = countBy(
      flatMap(
        filter.itemType === "nodes" ? parentGraph.nodes() : parentGraph.edges(),
        (itemId) => {
          const fieldValue = getFieldValue(itemData[itemId], filter.field);
          if (fieldValue === undefined && filter.field.type === "category")
            // if fieldValue is undefined we return the NA symbol but only for category field
            return unavailableValue;
          else return fieldValue;
        },
        // for category field we keep notAvailable values to propose it a possible filter value
      ).filter((v) => (filter.field.type !== "category" ? typeof v === "string" : true)),
      identity,
    );
    setDataTerms(terms as Record<string | symbol, number>);
  }, [filter, parentGraph, nodeData, edgeData]);
  console.log(filter.terms);
  return (
    <div className="w-100">
      <Select
        autoFocus
        value={
          filter.terms
            ? Array.from(filter.terms).map((term) => ({
                label: term === null ? t("filters.noValueOption") : term,
                value: term,
              }))
            : []
        }
        onChange={(options) => {
          const selectedValues = new Set(
            options.map((o): string | null =>
              o.value === unavailableValue || typeof o.value === "symbol" ? null : o.value,
            ),
          );
          updateFilter(filterIndex, {
            ...filter,
            terms: selectedValues.size > 0 ? selectedValues : undefined,
          });
        }}
        isMulti
        classNames={{
          multiValue: (state) => (state.data.value === null ? "fst-italic" : ""),
          option: (state) => (state.data.value === null ? "fst-italic" : ""),
        }}
        options={sortBy(toPairsCompatibleWithSymbol(dataTerms), ([_term, nbOcc]) => -1 * nbOcc).map(([term, nbOcc]) => {
          return {
            label: `${typeof term === "symbol" ? t("filters.noValueOption") : term} (${nbOcc} ${t(`graph.model.${filter.itemType}`)})`,
            value: term === unavailableValue ? null : term,
          };
        })}
      />
      {filter.field.type !== "category" && (
        <div className="form-check mt-1">
          <input
            className="form-check-input"
            type="checkbox"
            id="keepMissingValuesTerms"
            checked={!!filter.keepMissingValues}
            onChange={(e) => {
              updateFilter(filterIndex, { ...filter, keepMissingValues: e.target.checked });
            }}
          />

          <label className="from-check-label small" htmlFor="keepMissingValuesTerms">
            {t("filters.keepMissingValues")}
          </label>
        </div>
      )}
    </div>
  );
};
