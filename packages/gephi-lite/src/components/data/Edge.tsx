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
import { NodeComponent } from "./Node";

export const EdgeComponent: FC<{
  source: { label: ReactNode; color: string; hidden?: boolean };
  target: { label: ReactNode; color: string; hidden?: boolean };
  label: ReactNode;
  color: string;
  hidden?: boolean;
  directed?: boolean;
  className?: string;
  onSourceClick?: () => void;
  onTargetClick?: () => void;
  onEdgeClick?: () => void;
  nodeButtonTitle?: string;
  edgeButtonTitle?: string;
}> = ({
  label,
  color,
  source,
  target,
  hidden,
  directed,
  className,
  onSourceClick,
  onTargetClick,
  onEdgeClick,
  nodeButtonTitle,
  edgeButtonTitle,
}) => {
  const middle = (
    <div className="edge-wrapper">
      <div className="edge">
        <span className={cx(hidden ? "dotted" : "dash", "edge-body")} style={{ borderColor: color }} />{" "}
        {directed && <span className="edge-arrow" style={{ borderTopColor: color }} />}
      </div>
      {label && (
        <span className={cx("text-ellipsis my-1", hidden && "text-muted flex-grow-1", !label && "fst-italic")}>
          {label}
        </span>
      )}
    </div>
  );

  return (
    <div className={cx("edge-component", className)}>
      <div className="edge-source">
        <NodeComponent {...source} onClick={onSourceClick} buttonTitle={nodeButtonTitle} />
      </div>
      {onEdgeClick ? (
        <button type="button" className="edge-locate-button gl-locate-button" title={edgeButtonTitle} onClick={onEdgeClick}>
          {middle}
        </button>
      ) : (
        middle
      )}
      <div className="edge-target">
        <NodeComponent {...target} onClick={onTargetClick} buttonTitle={nodeButtonTitle} />
      </div>
    </div>
  );
};

export const EdgeComponentById: FC<{ id: string; locatable?: boolean }> = ({ id, locatable }) => {
  const { t } = useTranslation();
  const graphDataset = useGraphDataset();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();
  const { locateNode, locateEdge } = useLocateInGraph();

  // When locatable, clicking the source/target nodes locates them and clicking the middle
  // (connector/arrow) locates the edge — each navigating to the graph and centering the camera.
  const locateProps = locatable
    ? {
        nodeButtonTitle: t("selection.locate_on_graph"),
        edgeButtonTitle: t("selection.locate_on_graph"),
        onSourceClick: () => locateNode(graphDataset.fullGraph.source(id), { navigateToGraph: true }),
        onTargetClick: () => locateNode(graphDataset.fullGraph.target(id), { navigateToGraph: true }),
        onEdgeClick: () => locateEdge(id, { navigateToGraph: true }),
      }
    : {};

  const data = useMemo(() => {
    if (!filteredGraph.hasEdge(id)) return null;

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

  return data ? (
    <EdgeComponent {...data} {...locateProps} />
  ) : (
    <EdgeComponent
      label={<span className="fst-italic">?</span>}
      color="lightgrey"
      source={{ label: <span className="fst-italic">?</span>, color: "lightgrey" }}
      target={{ label: <span className="fst-italic">?</span>, color: "lightgrey" }}
    />
  );
};
