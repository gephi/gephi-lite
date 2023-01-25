import { FC, useEffect, useState } from "react";

import { TermsFilterType } from "../../core/filters/types";
import { graphDatasetAtom } from "../../core/graph";
import { useFiltersActions } from "../../core/context/dataContexts";
import { flatMap, uniq } from "lodash";
import { toString } from "../../core/utils/casting";

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
      <select
        onChange={(e) => {
          replaceCurrentFilter({ ...filter, terms: new Set(e.target.value) });
        }}
        multiple
      >
        {dataTerms.map((term) => (
          <option value={term} key={term}>
            {term}
          </option>
        ))}
      </select>
    </>
  );
};

export const TermsFilter: FC<{ filter: TermsFilterType; active?: boolean; editMode?: boolean }> = ({
  filter,
  editMode,
  active,
}) => {
  if (editMode) return <TermsFilterEditor filter={filter} />;
  else
    return (
      <div>
        {active ? "filtering" : "filter"} {filter.itemType} on {filter.field} {filter.terms}
      </div>
    );
};
