import cx from "classnames";
import { FC, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getItemAttributes } from "../../core/appearance/utils";
import {
  useDynamicItemData,
  useFilteredGraph,
  useGraphDataset,
  useVisualGetters,
} from "../../core/context/dataContexts";
import { mergeStaticDynamicData } from "../../core/graph/dynamicAttributes";
import { useLocateInGraph } from "../../hooks/useLocateInGraph";

/**
 * Grey used to render an item the current filters exclude, wherever it still has to be shown
 * (selection panel, graph summary, most recently updated item...). A filtered item keeps its real
 * label - hiding it behind a placeholder would make it unidentifiable - but is always drawn hollow
 * (nodes) or dotted (edges) in this grey, with a muted italic label, so "this is filtered out"
 * reads identically everywhere.
 */
export const FILTERED_ITEM_COLOR = "#adb5bd";

export const NodeComponent: FC<{
  label: ReactNode;
  color: string;
  hidden?: boolean;
  /**
   * When provided, the node is rendered as a button that locates it (see useLocateInGraph):
   * shared by every place a node is displayed (data table, edge source/target, selection panel),
   * so "clicking a node locates it" always behaves identically wherever it's used.
   */
  onClick?: () => void;
  buttonTitle?: string;
}> = ({ label, color, hidden, onClick, buttonTitle }) => {
  const { t } = useTranslation();
  const content = (
    <div className="d-flex align-items-center mw-100">
      <span
        className={cx(hidden ? "circle" : "disc gl-border", "me-1 flex-shrink-0 ")}
        style={{ backgroundColor: hidden ? FILTERED_ITEM_COLOR : color }}
      />
      <span className={cx(hidden && "text-muted fst-italic", !label && "fst-italic", "flex-shrink-1 text-truncate")}>
        {label || t("selection.node_no_label")}
      </span>
    </div>
  );

  return onClick ? (
    <button type="button" className="node-locate-button gl-locate-button" title={buttonTitle} onClick={onClick}>
      {content}
    </button>
  ) : (
    content
  );
};

export const NodeComponentById: FC<{ id: string; locatable?: boolean }> = ({ id, locatable }) => {
  const { t } = useTranslation();
  const graphDataset = useGraphDataset();
  const dynamicItemData = useDynamicItemData();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();
  const { locateNode } = useLocateInGraph();

  // A filtered out node is rendered too (greyed out, see FILTERED_ITEM_COLOR): `getItemAttributes`
  // flags it as `hidden`, and its data is read from the dataset, which holds every node whatever
  // the filters. Only a node missing from the dataset entirely (just deleted) renders nothing.
  const data = useMemo(() => {
    const itemData = mergeStaticDynamicData(graphDataset.nodeData, dynamicItemData.dynamicNodeData)[id];
    if (!itemData) return null;
    return getItemAttributes("nodes", id, filteredGraph, itemData, graphDataset, visualGetters);
  }, [id, graphDataset, visualGetters, dynamicItemData, filteredGraph]);

  if (!data) return null;

  // When locatable, clicking the node locates it: navigate to the graph and center the camera on
  // it. A filtered out node is absent from the rendering, so there is nothing to locate.
  const isLocatable = locatable && !data.hidden;
  return (
    <NodeComponent
      {...data}
      onClick={isLocatable ? () => locateNode(id, { navigateToGraph: true }) : undefined}
      buttonTitle={isLocatable ? t("selection.locate_on_graph") : undefined}
    />
  );
};
