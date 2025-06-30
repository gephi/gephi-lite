import { useReadAtom } from "@ouestware/atoms";
import { countBy, flatMap, identity, sortBy, toPairs } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { TermsFilterType } from "../../core/filters/types";
import { parentFilteredGraphAtom } from "../../core/graph";
import {
  computeAllDynamicAttributes,
  mergeStaticDynamicData,
  staticDynamicAttributeLabel,
} from "../../core/graph/dynamicAttributes";
import { getFieldValue } from "../../core/graph/fieldModel";
import { Select } from "../forms/Select";
import { FilteredGraphSummary } from "./FilteredGraphSummary";

const TermsFilterEditor: FC<{ filter: TermsFilterType }> = ({ filter }) => {
  const parentGraph = useReadAtom(parentFilteredGraphAtom);
  const { nodeData, edgeData } = useGraphDataset();

  const { t } = useTranslation();
  const { replaceCurrentFilter } = useFiltersActions();
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
      flatMap(filter.itemType === "nodes" ? parentGraph.nodes() : parentGraph.edges(), (itemId) => {
        const v = getFieldValue(itemData[itemId], filter.field);
        return v;
      }).filter((v) => typeof v === "string"),
      identity,
    );
    setDataTerms(terms);
  }, [filter, parentGraph, nodeData, edgeData]);

  return (
    <div className="my-3 w-100">
      <Select
        value={filter.terms ? Array.from(filter.terms).map((t) => ({ label: t, value: t })) : []}
        onChange={(options) => {
          const selectedValues = new Set(options.map((o) => o.value));
          replaceCurrentFilter({ ...filter, terms: selectedValues.size > 0 ? selectedValues : undefined });
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
            replaceCurrentFilter({ ...filter, keepMissingValues: e.target.checked });
          }}
        />
        <label className="from-check-label small" htmlFor="keepMissingValues">
          {t("filters.keepMissingValues")}
        </label>
      </div>
    </div>
  );
};

export const TermsFilter: FC<{
  filter: TermsFilterType;
  filterIndex: number;
  active?: boolean;
  editMode?: boolean;
}> = ({ filter, editMode, filterIndex, active }) => {
  const { t, i18n } = useTranslation();

  const listFormatter = new Intl.ListFormat(i18n.language, { style: "long", type: "conjunction" });

  return (
    <>
      <div className="fs-5">
        {staticDynamicAttributeLabel(filter.field)} ({t(`graph.model.${filter.itemType}`)})
      </div>

      {active && <FilteredGraphSummary filterIndex={filterIndex} />}
      {!editMode && (
        <div>
          <span className="fs-5">{filter.terms ? listFormatter.format(filter.terms) : t("common.all")}</span>
        </div>
      )}
      {editMode && <TermsFilterEditor filter={filter} />}
    </>
  );
};
