import cx from "classnames";
import { FC, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getItemAttributes } from "../core/appearance/utils";
import { useDynamicItemData, useFilteredGraph, useGraphDataset, useVisualGetters } from "../core/context/dataContexts";
import { NodeComponent } from "./Node";

export const EdgeComponent: FC<{
  source: { label: ReactNode; color: string; hidden?: boolean };
  target: { label: ReactNode; color: string; hidden?: boolean };
  label: ReactNode;
  color: string;
  hidden?: boolean;
  directed?: boolean;
}> = ({ label, color, source, target, hidden, directed }) => {
  const { t } = useTranslation();

  return (
    <div className="d-flex flex-column">
      <div className="text-ellipsis small">
        <NodeComponent {...source} />
      </div>
      <div className="d-flex justify-content-start align-items-stretch">
        <div className="edge flex-grow-0 me-1 small">
          <span className={cx(hidden ? "dotted" : "dash", "edge-body")} style={{ borderColor: color }} />{" "}
          {directed && <span className="edge-arrow" style={{ borderTopColor: color }} />}
        </div>
        <span className={cx("text-ellipsis", hidden && "text-muted flex-grow-1", !label && "fst-italic")}>
          {label || t("selection.edge_no_label")}
        </span>
      </div>
      <div className="text-ellipsis small">
        <NodeComponent {...target} />
      </div>
    </div>
  );
};

export const EdgeComponentById: FC<{ id: string }> = ({ id }) => {
  const graphDataset = useGraphDataset();
  const dynamicItemData = useDynamicItemData();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();

  const data = useMemo(() => {
    const source = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.source(id),
      filteredGraph,
      graphDataset,
      dynamicItemData,
      visualGetters,
    );
    const target = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.target(id),
      filteredGraph,
      graphDataset,
      dynamicItemData,
      visualGetters,
    );
    const data = getItemAttributes("edges", id, filteredGraph, graphDataset, dynamicItemData, visualGetters);
    return {
      ...data,
      source,
      target,
    };
  }, [id, graphDataset, visualGetters, dynamicItemData, filteredGraph]);

  return <EdgeComponent {...data} />;
};
