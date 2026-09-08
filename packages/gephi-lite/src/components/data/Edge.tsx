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
import { FILTERED_ITEM_COLOR, NodeComponent } from "./Node";

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
  // A filtered out edge is drawn dotted and grey (see FILTERED_ITEM_COLOR) rather than keeping its
  // appearance color, and so are both its extremities (see below), even when those nodes pass the
  // filters themselves: the whole row is absent from the graph, so it reads as filtered as a whole.
  const strokeColor = hidden ? FILTERED_ITEM_COLOR : color;
  const middle = (
    <div className="edge-wrapper">
      <div className="edge">
        <span className={cx(hidden ? "dotted" : "dash", "edge-body")} style={{ borderColor: strokeColor }} />{" "}
        {directed && <span className="edge-arrow" style={{ borderTopColor: strokeColor }} />}
      </div>
      {label && (
        <span
          className={cx("text-ellipsis my-1", hidden && "text-muted fst-italic flex-grow-1", !label && "fst-italic")}
        >
          {label}
        </span>
      )}
    </div>
  );

  return (
    <div className={cx("edge-component", className)}>
      <div className="edge-source">
        <NodeComponent
          {...source}
          hidden={hidden || source.hidden}
          onClick={onSourceClick}
          buttonTitle={nodeButtonTitle}
        />
      </div>
      {onEdgeClick ? (
        <button
          type="button"
          className="edge-locate-button gl-locate-button"
          title={edgeButtonTitle}
          onClick={onEdgeClick}
        >
          {middle}
        </button>
      ) : (
        middle
      )}
      <div className="edge-target">
        <NodeComponent
          {...target}
          hidden={hidden || target.hidden}
          onClick={onTargetClick}
          buttonTitle={nodeButtonTitle}
        />
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

  // A filtered out edge is rendered too (dotted and greyed out, see FILTERED_ITEM_COLOR): its
  // data, and its extremities', come from the dataset, which holds every item whatever the filters.
  // Only an edge missing from the dataset entirely (just deleted) renders nothing.
  const data = useMemo(() => {
    if (!graphDataset.fullGraph.hasEdge(id)) return null;

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

  if (!data) return null;

  // When locatable, clicking the source/target nodes locates them and clicking the middle
  // (connector/arrow) locates the edge — each navigating to the graph and centering the camera.
  // A filtered out edge is absent from the rendering, so there is nothing to locate.
  const locateProps =
    locatable && !data.hidden
      ? {
          nodeButtonTitle: t("selection.locate_on_graph"),
          edgeButtonTitle: t("selection.locate_on_graph"),
          onSourceClick: () => locateNode(graphDataset.fullGraph.source(id), { navigateToGraph: true }),
          onTargetClick: () => locateNode(graphDataset.fullGraph.target(id), { navigateToGraph: true }),
          onEdgeClick: () => locateEdge(id, { navigateToGraph: true }),
        }
      : {};

  return <EdgeComponent {...data} {...locateProps} />;
};
