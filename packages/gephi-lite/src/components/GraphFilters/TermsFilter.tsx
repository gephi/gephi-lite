import { countBy, flatMap, identity, sortBy } from "lodash";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { TermsFilterType } from "../../core/filters/types";
import { useFilteredGraphAt } from "../../core/graph";
import { computeAllDynamicAttributes, mergeStaticDynamicData } from "../../core/graph/dynamicAttributes";
import { getFieldValue } from "../../core/graph/fieldModel";
import { BaseOption, Select } from "../forms/Select";
import { toPairsCompatibleWithSymbol } from "./utils";

const unavailableValue: unique symbol = Symbol("Not Available");
const trueValue: unique symbol = Symbol("True Value");
const falseValue: unique symbol = Symbol("False Value");

type TermsFilterSymbolsType = typeof unavailableValue | typeof trueValue | typeof falseValue;
const symbolToValue = (symbol: TermsFilterSymbolsType): boolean | null => {
  switch (symbol) {
    case unavailableValue:
      return null;
    case trueValue:
      return true;
    case falseValue:
      return false;
  }
};
const valueToSymbol = (value: string | boolean | null): string | TermsFilterSymbolsType => {
  switch (typeof value) {
    case "string":
      return value;
    case "boolean":
      return value === true ? trueValue : falseValue;
    default:
      return unavailableValue;
  }
};

export const TermsFilter: FC<{ filter: TermsFilterType; filterIndex: number }> = ({ filter, filterIndex }) => {
  const parentGraph = useFilteredGraphAt(filterIndex - 1);
  const { nodeData, edgeData } = useGraphDataset();

  const { t } = useTranslation();
  const termLabel = useCallback(
    (term: string | TermsFilterSymbolsType) => {
      switch (term) {
        case unavailableValue:
          return t("filters.noValueOption");
        case trueValue:
          return t("filters.booleanTrueOption");
        case falseValue:
          return t("filters.booleanFalseOption");
        default:
          return term;
      }
    },
    [t],
  );
  const { updateFilter } = useFiltersActions();
  const [dataTerms, setDataTerms] = useState<Record<string | TermsFilterSymbolsType, number>>({
    [unavailableValue]: 0,
    [trueValue]: 0,
    [falseValue]: 0,
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
          if (fieldValue === undefined && (filter.field.type === "category" || filter.field.type === "boolean"))
            // if fieldValue is undefined we return the NA symbol but only for category field
            return unavailableValue;
          if (filter.field.type === "boolean") return fieldValue === true ? trueValue : falseValue;
          return fieldValue;
        },
        // for category field we keep notAvailable values to propose it a possible filter value
      ).filter((v) =>
        filter.field.type !== "category" && filter.field.type !== "boolean" ? typeof v === "string" : true,
      ),
      identity,
    );
    setDataTerms(terms as Record<string | symbol, number>);
  }, [filter, parentGraph, nodeData, edgeData]);

  return (
    <div className="w-100">
      <Select<BaseOption<string | null | boolean>, true>
        autoFocus
        value={
          filter.terms
            ? Array.from(filter.terms).map((term) => ({
                label: termLabel(valueToSymbol(term)),
                value: term,
              }))
            : []
        }
        onChange={(options) => {
          const selectedValues = new Set(options.map((o): string | null | boolean => o.value));
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
            label: `${termLabel(term as string | TermsFilterSymbolsType)} (${nbOcc} ${t(`graph.model.${filter.itemType}`)})`,
            value: typeof term === "string" ? term : symbolToValue(term as TermsFilterSymbolsType),
          };
        })}
      />
      {filter.field.type !== "category" && filter.field.type !== "boolean" && (
        <div className="form-check mt-1">
          <input
            className="form-check-input"
            type="checkbox"
            id="keepMissingValuesTerms"
            checked={filter.keepMissingValues === true}
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
