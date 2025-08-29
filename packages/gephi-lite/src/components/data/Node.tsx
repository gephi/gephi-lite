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

export const NodeComponent: FC<{ label: ReactNode; color: string; hidden?: boolean }> = ({ label, color, hidden }) => {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center mw-100">
      <span
        className={cx(hidden ? "circle" : "disc gl-border", "me-1 flex-shrink-0 ")}
        style={{ backgroundColor: color }}
      />
      <span className={cx(hidden && "text-muted", !label && "fst-italic", "flex-shrink-1 text-truncate")}>
        {label || t("selection.node_no_label")}
      </span>
    </div>
  );
};

export const NodeComponentById: FC<{ id: string }> = ({ id }) => {
  const graphDataset = useGraphDataset();
  const dynamicItemData = useDynamicItemData();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();

  const data = useMemo(
    () =>
      filteredGraph.hasNode(id)
        ? getItemAttributes(
            "nodes",
            id,
            filteredGraph,
            mergeStaticDynamicData(graphDataset.nodeData, dynamicItemData.dynamicNodeData)[id],
            graphDataset,
            visualGetters,
          )
        : null,
    [id, graphDataset, visualGetters, dynamicItemData, filteredGraph],
  );

  return data ? (
    <NodeComponent {...data} />
  ) : (
    <NodeComponent label={<span className="fst-italic">?</span>} color="lightgrey" />
  );
};
