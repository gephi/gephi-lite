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
  const filteredGraph = useFilteredGraph();
  const {
    metadata: { title, type },
    fullGraph,
  } = useGraphDataset();

  return (
    <div className={cx("graph-summary d-flex flex-column gl-gap-sm", className)}>
      <div className="graph-title gl-px-sm">{title}</div>
      <div className="gl-px-sm gl-gap-y-sm d-flex flex-column">
        <div className="d-flex flex-row flex-wrap gl-gap-x-sm gl-gap-y-md" style={{ lineHeight: 1.2 }}>
          <GraphStat className="" type="nodes" current={filteredGraph.order} total={fullGraph.order} />
          <GraphStat type="edges" current={filteredGraph.size} total={fullGraph.size} />
        </div>
        <span>{t(`graph.model.${type || "mixed"}`)}</span>
      </div>
    </div>
  );
};
