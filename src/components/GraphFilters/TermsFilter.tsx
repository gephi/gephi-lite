import { countBy, flatMap, identity, sortBy, toPairs } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { useFiltersActions } from "../../core/context/dataContexts";
import { TermsFilterType } from "../../core/filters/types";
import { graphDatasetAtom, parentFilteredGraphAtom } from "../../core/graph";
import { useReadAtom } from "../../core/utils/atoms";
import { toString } from "../../core/utils/casting";
import { DEFAULT_SELECT_PROPS } from "../consts";

const TermsFilterEditor: FC<{ filter: TermsFilterType }> = ({ filter }) => {
  const parentGraph = useReadAtom(parentFilteredGraphAtom);
  const { t } = useTranslation();
  const { replaceCurrentFilter } = useFiltersActions();
  const [dataTerms, setDataTerms] = useState<Record<string, number>>({});

  useEffect(() => {
    const attributes = filter.itemType === "nodes" ? graphDatasetAtom.get().nodeData : graphDatasetAtom.get().edgeData;
    const terms = countBy(
      flatMap(filter.itemType === "nodes" ? parentGraph.nodes() : parentGraph.edges(), (itemId) => {
        const v = attributes[itemId][filter.field];
        return [toString(v)];
      }) as string[],
      identity,
    );
    setDataTerms(terms);
  }, [filter, parentGraph]);

  return (
    <>
      <Select
        {...DEFAULT_SELECT_PROPS}
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
        <label className="from-check-label" htmlFor="keepMissingValues">
          {t("filters.keepMissingValues")}
        </label>
      </div>
    </>
  );
};

export const TermsFilter: FC<{
  filter: TermsFilterType;
  active?: boolean;
  editMode?: boolean;
}> = ({ filter, editMode }) => {
  const { t, i18n } = useTranslation();

  //TODO: adapt language
  const listFormatter = new Intl.ListFormat(i18n.language, { style: "long", type: "conjunction" });

  return (
    <div>
      <div className="fs-5">
        {filter.field} ({t(`graph.model.${filter.itemType}`)})
      </div>
      {editMode ? (
        <TermsFilterEditor filter={filter} />
      ) : (
        <div>
          <span className="fs-5">{filter.terms ? listFormatter.format(filter.terms) : t("common.all")}</span>
        </div>
      )}
    </div>
  );
};
