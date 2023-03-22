import { FC, useEffect, useState } from "react";
import Select from "react-select";

import { TermsFilterType } from "../../core/filters/types";
import { graphDatasetAtom } from "../../core/graph";
import { useFiltersActions } from "../../core/context/dataContexts";
import { countBy, flatMap, identity, sortBy, toPairs } from "lodash";
import { toString } from "../../core/utils/casting";
import { useTranslation } from "react-i18next";

const TermsFilterEditor: FC<{ filter: TermsFilterType }> = ({ filter }) => {
  const { t } = useTranslation();
  const { replaceCurrentFilter } = useFiltersActions();
  const [dataTerms, setDataTerms] = useState<Record<string, number>>({});

  useEffect(() => {
    const terms = countBy(
      flatMap(
        filter.itemType === "nodes" ? graphDatasetAtom.get().nodeData : graphDatasetAtom.get().edgeData,
        (nodeData) => {
          const v = nodeData[filter.field];
          return [toString(v)];
        },
      ) as string[],
      identity,
    );
    setDataTerms(terms);
  }, [filter]);

  return (
    <>
      <Select
        value={filter.terms ? Array.from(filter.terms).map((t) => ({ label: t, value: t })) : []}
        onChange={(options) => {
          replaceCurrentFilter({ ...filter, terms: new Set(options.map((o) => o.value)) });
        }}
        isMulti
        options={sortBy(toPairs(dataTerms), ([term, nbOcc]) => -1 * nbOcc).map(([term, nbOcc]) => ({
          label: `${term} (${nbOcc} ${t(`graph.model.${filter.itemType}`)})`,
          value: term,
        }))}
      />
    </>
  );
};

export const TermsFilter: FC<{ filter: TermsFilterType; active?: boolean; editMode?: boolean }> = ({
  filter,
  editMode,
  active,
}) => {
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
