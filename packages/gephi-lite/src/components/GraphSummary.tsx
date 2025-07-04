import type { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { capitalize } from "lodash";
import { type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useFilteredGraph, useFilters, useGraphDataset, usePreferences } from "../core/context/dataContexts";
import { FiltersIconFill } from "./common-icons";

const GraphStat: FC<{ className?: string; type: ItemType; current: number; total: number }> = ({
  className,
  type,
  current,
  total,
}) => {
  const { locale } = usePreferences();
  const { t } = useTranslation();

  const isFiltered = useMemo(() => current !== total, [current, total]);

  return (
    <div className={cx("d-flex flex-column", className)}>
      <div>{capitalize(t(`graph.model.${type}`))}</div>
      <div>
        <span>
          {current.toLocaleString(locale)}
          {isFiltered && <> ({((current / total) * 100).toFixed(1)}%)</>}
        </span>
        {isFiltered && <div className="text-muted">of {total.toLocaleString(locale)}</div>}
      </div>
    </div>
  );
};

export const GraphSummary: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const filterState = useFilters();
  const filteredGraph = useFilteredGraph();
  const {
    metadata: { title, type },
    fullGraph,
  } = useGraphDataset();

  const hasFilters = useMemo(
    () => filterState.future.length + filterState.past.length,
    [filterState.future, filterState.past],
  );

  return (
    <div className={cx("graph-summary d-flex flex-column gl-gap-2", className)}>
      <div className="graph-title gl-px-2">{title}</div>
      <div className="gl-px-2 gl-gap-x-2 d-flex flex-column position-relative">
        <div className="d-flex flex-row flex-wrap gl-gap-x-2 gl-gap-y-3" style={{ lineHeight: 1.2 }}>
          <GraphStat type="nodes" current={filteredGraph.order} total={fullGraph.order} />
          <GraphStat type="edges" current={filteredGraph.size} total={fullGraph.size} />
        </div>
        <span>{t(`graph.model.${type || "mixed"}_graph`)}</span>

        {hasFilters && <FiltersIconFill style={{ left: "calc(100% - 1.5em)", top: 0, position: "absolute" }} />}
      </div>
    </div>
  );
};
