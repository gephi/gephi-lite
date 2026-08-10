import type { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { capitalize } from "lodash";
import { type FC, type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useFilteredGraph, useFilters, useGraphDataset, usePreferences } from "../core/context/dataContexts";
import { getMostRecentlyUpdatedItem } from "../core/graph/dates";
import { useModal } from "../core/modals";
import { CreateEdgeIcon, CreateNodeIcon, EditIcon, FiltersIcon, FiltersIconFill } from "./common-icons";
import { EdgeComponentById } from "./data/Edge";
import { EditEdgeModal } from "./data/EditEdge";
import { EditNodeModal } from "./data/EditNode";
import { NodeComponentById } from "./data/Node";
import { GraphMetadataModal } from "./modals/GraphMetadataModal";

const GraphStat: FC<{
  className?: string;
  type: ItemType;
  current: number;
  total: number;
  // The item of this type whose update date is the most recent, if any: shown (locatable) with its
  // date under the count, so the last edited node/edge is always one click away from the summary.
  mostRecent: { id: string; date: string } | null;
  // Extra content shown below the most-recent item's date (used to slot the graph type under the
  // nodes column, roughly level with the edge's 3-line source/target preview in the edges column).
  footer?: ReactNode;
}> = ({ className, type, current, total, mostRecent, footer }) => {
  const { locale } = usePreferences();
  const { t } = useTranslation();
  const { openModal } = useModal();

  const isFiltered = useMemo(() => current !== total, [current, total]);

  return (
    <div className={cx("d-flex flex-column", className)} style={{ flex: "1 1 0", minWidth: 0 }}>
      <div className="d-flex flex-row align-items-center gl-gap-1">
        <span>{capitalize(t(`graph.model.${type}`))}</span>
        <button
          className="gl-btn gl-btn-icon"
          title={t(`edition.create_${type}`)}
          aria-label={t(`edition.create_${type}`)}
          onClick={() =>
            type === "nodes"
              ? openModal({ component: EditNodeModal, arguments: {} })
              : openModal({ component: EditEdgeModal, arguments: {} })
          }
        >
          {type === "nodes" ? <CreateNodeIcon /> : <CreateEdgeIcon />}
        </button>
      </div>
      <div>
        <span>
          {current.toLocaleString(locale)}
          {isFiltered && <> ({((current / total) * 100).toFixed(1)}%)</>}
        </span>
        {isFiltered && <div className="text-muted">of {total.toLocaleString(locale)}</div>}
      </div>
      {mostRecent && (
        <div className="mt-1 mw-100" title={t("graph.model.most_recently_updated")}>
          {type === "nodes" ? (
            <NodeComponentById id={mostRecent.id} locatable />
          ) : (
            <EdgeComponentById id={mostRecent.id} locatable />
          )}
          <div className="text-muted small">{mostRecent.date}</div>
        </div>
      )}
      {footer}
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

export const GraphSummary: FC<{ className?: string; onOpenFilters?: () => void; children?: ReactNode }> = ({
  className,
  onOpenFilters,
  children,
}) => {
  const { t } = useTranslation();
  const filterState = useFilters();
  const filteredGraph = useFilteredGraph();
  const { metadata, fullGraph, nodeData, edgeData } = useGraphDataset();

  // A filter that has been switched off no longer restricts the graph, so it must not keep the
  // badge filled: only the filters still applied count as "active".
  const hasFilters = useMemo(() => filterState.filters.some((filter) => !filter.disabled), [filterState.filters]);
  const mostRecentNode = useMemo(() => getMostRecentlyUpdatedItem(nodeData), [nodeData]);
  const mostRecentEdge = useMemo(() => getMostRecentlyUpdatedItem(edgeData), [edgeData]);

  return (
    <div className={cx("graph-summary d-flex flex-column gl-gap-2", className)}>
      <GraphTitle title={metadata.title} />
      {children}
      <div className="gl-px-2 gl-gap-x-2 d-flex flex-column position-relative">
        <div className="d-flex flex-row gl-gap-x-3" style={{ lineHeight: 1.2 }}>
          <GraphStat
            type="nodes"
            current={filteredGraph.order}
            total={fullGraph.order}
            mostRecent={mostRecentNode}
            footer={<span>{t(`graph.model.${fullGraph.type}_graph`)}</span>}
          />
          <GraphStat type="edges" current={filteredGraph.size} total={fullGraph.size} mostRecent={mostRecentEdge} />
        </div>

        <button
          type="button"
          className="gl-btn gl-btn-icon"
          style={{ left: "calc(100% - 1.5em)", top: 0, position: "absolute" }}
          title={t(hasFilters ? "filters.active" : "filters.inactive")}
          aria-label={t(hasFilters ? "filters.active" : "filters.inactive")}
          onClick={onOpenFilters}
        >
          {hasFilters ? <FiltersIconFill /> : <FiltersIcon />}
        </button>
      </div>
    </div>
  );
};
