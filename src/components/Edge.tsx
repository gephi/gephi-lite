import cx from "classnames";
import { FC, ReactNode, useMemo } from "react";

import { useFilteredGraph, useGraphDataset, useVisualGetters } from "../core/context/dataContexts";
import { getItemAttributes } from "../core/appearance/utils";
import { NodeComponent } from "./Node";

export const EdgeComponent: FC<{
  source: { label: ReactNode; color: string; hidden?: boolean };
  target: { label: ReactNode; color: string; hidden?: boolean };
  label: ReactNode;
  color: string;
  hidden?: boolean;
  directed?: boolean;
}> = ({ label, color, source, target, hidden, directed }) => {
  const vizSize = "0.7em";
  return (
    <div className="d-flex flex-column">
      <div className="text-ellipsis small">
        <NodeComponent {...source} />
      </div>
      <div className="d-flex justify-content-start align-items-center">
        <div className="edge flex-grow-0 me-1 ">
          <span className={cx(hidden ? "dotted" : "dash", "edge-body")} style={{ borderColor: color }} />{" "}
          {directed && <span className={cx("edge-arrow")} style={{ borderTopColor: color }} />}
        </div>
        {label && <span className={cx(hidden && "text-muted flex-grow-1")}>{label}</span>}
      </div>
      <div className="text-ellipsis small">
        <NodeComponent {...target} />
      </div>
    </div>
  );
};

export const EdgeComponentById: FC<{ id: string }> = ({ id }) => {
  const graphDataset = useGraphDataset();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();

  const data = useMemo(() => {
    const source = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.source(id),
      filteredGraph,
      graphDataset,
      visualGetters,
    );
    const target = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.target(id),
      filteredGraph,
      graphDataset,
      visualGetters,
    );
    const data = getItemAttributes("edges", id, filteredGraph, graphDataset, visualGetters);
    return {
      ...data,
      source,
      target,
    };
  }, [id, graphDataset, visualGetters, filteredGraph]);

  return <EdgeComponent {...data} />;
};
