import { FC, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import cx from "classnames";

import { useFilteredGraph, useGraphDataset, useVisualGetters } from "../core/context/dataContexts";
import { getItemAttributes } from "../core/appearance/utils";

export const NodeComponent: FC<{ label: ReactNode; color: string; hidden?: boolean }> = ({ label, color, hidden }) => {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center mw-100">
      <span className={cx(hidden ? "circle" : "disc", "me-1 flex-shrink-0 ")} style={{ backgroundColor: color }} />
      <span className={cx(hidden && "text-muted", !label && "fst-italic", "flex-shrink-1 text-truncate")}>
        {label || t("selection.node_no_label")}
      </span>
    </div>
  );
};

export const NodeComponentById: FC<{ id: string }> = ({ id }) => {
  const graphDataset = useGraphDataset();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();

  const data = useMemo(
    () => getItemAttributes("nodes", id, filteredGraph, graphDataset, visualGetters),
    [id, graphDataset, visualGetters, filteredGraph],
  );

  return <NodeComponent {...data} />;
};
