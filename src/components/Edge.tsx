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
  return (
    <div className="d-flex flex-column">
      <div className="text-ellipsis">
        <NodeComponent {...source} />
      </div>
      <div>
        <span className={cx(hidden ? "dotted" : "dash", directed && "arrow")} style={{ borderColor: color }} />{" "}
        {label && <span className={cx(hidden && "text-muted")}>{label}</span>}
      </div>
      <div className="text-ellipsis">
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
