import cx from "classnames";
import { FC, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getItemAttributes } from "../core/appearance/utils";
import { useDynamicItemData, useFilteredGraph, useGraphDataset, useVisualGetters } from "../core/context/dataContexts";
import { mergeStaticDynamicData } from "../core/graph/dynamicAttributes";
import { NodeComponent } from "./Node";

export const EdgeComponent: FC<{
  source: { label: ReactNode; color: string; hidden?: boolean };
  target: { label: ReactNode; color: string; hidden?: boolean };
  label: ReactNode;
  color: string;
  hidden?: boolean;
  directed?: boolean;
  className?: string;
}> = ({ label, color, source, target, hidden, directed, className }) => {
  const { t } = useTranslation();

  return (
    <div className={cx("d-flex flex-column", className)}>
      <div className="text-ellipsis small">
        <NodeComponent {...source} />
      </div>
      <div className="d-flex justify-content-start align-items-stretch">
        <div className="edge flex-grow-0 me-1 small">
          <span className={cx(hidden ? "dotted" : "dash", "edge-body")} style={{ borderColor: color }} />{" "}
          {directed && <span className="edge-arrow" style={{ borderTopColor: color }} />}
        </div>
        <span className={cx("text-ellipsis my-1", hidden && "text-muted flex-grow-1", !label && "fst-italic")}>
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
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();

  const data = useMemo(() => {
    const source = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.source(id),
      filteredGraph,
      mergeStaticDynamicData(graphDataset.nodeData, dynamicNodeData)[graphDataset.fullGraph.source(id)],
      graphDataset,
      visualGetters,
    );
    const target = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.target(id),
      filteredGraph,
      mergeStaticDynamicData(graphDataset.nodeData, dynamicNodeData)[graphDataset.fullGraph.target(id)],
      graphDataset,
      visualGetters,
    );
    const data = getItemAttributes(
      "edges",
      id,
      filteredGraph,
      mergeStaticDynamicData(graphDataset.edgeData, dynamicEdgeData)[id],
      graphDataset,
      visualGetters,
    );
    return {
      ...data,
      source,
      target,
    };
  }, [id, graphDataset, visualGetters, dynamicNodeData, dynamicEdgeData, filteredGraph]);

  return <EdgeComponent {...data} />;
};
