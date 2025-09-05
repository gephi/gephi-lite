import type { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { capitalize } from "lodash";
import { type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useFilteredGraph, useFilters, useGraphDataset, usePreferences } from "../core/context/dataContexts";
import { useModal } from "../core/modals";
import { EditIcon, FiltersIconFill } from "./common-icons";
import { GraphMetadataModal } from "./modals/GraphMetadataModal";

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

const GraphTitle: FC<{ title?: string }> = ({ title }) => {
  const { openModal } = useModal();

  return (
    <div className="graph-title d-flex" style={{ alignItems: "baseline" }}>
      <span className="flex-grow-1 gl-px-2 gl-text-wrap-anywhere"> {title || "Untitled workspace"}</span>

      <button
        id="graph-title-btn"
        onClick={() => {
          openModal({ component: GraphMetadataModal, arguments: {} });
        }}
        className={cx("gl-btn gl-btn-icon")}
      >
        <EditIcon />
      </button>
    </div>
  );
};

export const GraphSummary: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const filterState = useFilters();
  const filteredGraph = useFilteredGraph();
  const { metadata, fullGraph } = useGraphDataset();

  const hasFilters = useMemo(() => !!filterState.filters.length, [filterState.filters]);

  return (
    <div className={cx("graph-summary d-flex flex-column gl-gap-2", className)}>
      <GraphTitle title={metadata.title} />
      <div className="gl-px-2 gl-gap-x-2 d-flex flex-column position-relative">
        <div className="d-flex flex-row flex-wrap gl-gap-x-3 gl-gap-y-3" style={{ lineHeight: 1.2 }}>
          <GraphStat type="nodes" current={filteredGraph.order} total={fullGraph.order} />
          <GraphStat type="edges" current={filteredGraph.size} total={fullGraph.size} />
        </div>
        <span>{t(`graph.model.${fullGraph.type}_graph`)}</span>

        {hasFilters && <FiltersIconFill style={{ left: "calc(100% - 1.5em)", top: 0, position: "absolute" }} />}
      </div>
    </div>
  );
};
