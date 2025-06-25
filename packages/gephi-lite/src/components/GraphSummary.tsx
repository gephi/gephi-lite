import type { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { capitalize } from "lodash";
import { type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useFilteredGraph, useGraphDataset, usePreferences } from "../core/context/dataContexts";

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
      <div>{capitalize(t(`graph.model.${type}`) as string)}</div>
      <div>
        <span>{current.toLocaleString(locale)}</span>
        {isFiltered && (
          <div className="d-flex flex-column">
            <span>({((current / total) * 100).toFixed(1)}%)</span>
            <span className="text-muted">of {total.toLocaleString(locale)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const GraphSummary: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const filteredGraph = useFilteredGraph();
  const {
    metadata: { title, type },
    fullGraph,
  } = useGraphDataset();

  return (
    <div className={cx("graph-summary", className)}>
      <div className="graph-title mb-1">{title}</div>
      <div className="d-flex flex-row mb-1">
        <GraphStat className="flex-grow-1 me-1" type="nodes" current={filteredGraph.order} total={fullGraph.order} />
        <GraphStat className="flex-grow-1" type="edges" current={filteredGraph.size} total={fullGraph.size} />
      </div>
      <span>{t(`graph.model.${type || "mixed"}`)} graph</span>
    </div>
  );
};
