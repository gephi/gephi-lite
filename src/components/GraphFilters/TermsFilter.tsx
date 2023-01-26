import { FC, useEffect, useState } from "react";
import Select from "react-select";

import { TermsFilterType } from "../../core/filters/types";
import { graphDatasetAtom } from "../../core/graph";
import { useFiltersActions } from "../../core/context/dataContexts";
import { flatMap, uniq } from "lodash";
import { toString } from "../../core/utils/casting";
import { useTranslation } from "react-i18next";

const TermsFilterEditor: FC<{ filter: TermsFilterType }> = ({ filter }) => {
  const { replaceCurrentFilter } = useFiltersActions();

  const [dataTerms, setDataTerms] = useState<string[]>([]);

  useEffect(() => {
    const terms = uniq(
      flatMap(
        filter.itemType === "nodes" ? graphDatasetAtom.get().nodeData : graphDatasetAtom.get().edgeData,
        (nodeData) => {
          const v = nodeData[filter.field];
          return [toString(v)];
        },
      ) as string[],
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
        options={dataTerms.map((term) => ({ label: term, value: term }))}
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
