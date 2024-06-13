import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TOPOLOGICAL_FILTERS_DICT } from "../../core/filters/collection";
import { TopologicalFilterType } from "../../core/filters/types";

const TopologicalFilterEditor: FC<{ filter: TopologicalFilterType }> = ({ filter }) => {
  const filterDef = useMemo(() => TOPOLOGICAL_FILTERS_DICT[filter.method], [filter.method]);

  return <>{filterDef.parameters.map((parameter) => {

  })}</>;
};

export const TopologicalFilter: FC<{
  filter: TopologicalFilterType;
  active?: boolean;
  editMode?: boolean;
}> = ({ filter, editMode }) => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <div className="fs-5">{t(`graph.model.${filter.method}`)}</div>
      {editMode ? (
        <TopologicalFilterEditor filter={filter} />
      ) : (
        <div>
          <span className="fs-5"></span>
        </div>
      )}
    </div>
  );
};
