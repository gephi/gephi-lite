import { FC, useState } from "react";
import { NodeEdgeProps, NodeEdgeTabs } from "../forms/NodeEdgeTabs";
import { ColorItem } from "./ColorItem";

export const GraphAppearance: FC = () => {
  return (
    <NodeEdgeTabs>
      <GraphItemAppearance nodeEdge="node" />
    </NodeEdgeTabs>
  );
};

const GraphItemAppearance: FC<NodeEdgeProps> = ({ nodeEdge }) => {
  //TODO: retrieve partition from CONTEXT and split by partitions
  const [edgesHidden, setEdgesHidden] = useState<boolean>(false);
  //TODO: replace by core.model types once done

  return (
    <div>
      {nodeEdge === "edge" && (
        <button className="btn btn-primary" onClick={() => setEdgesHidden(!edgesHidden)}>
          {edgesHidden ? "Show" : "Hide"} edges
        </button>
      )}

      {
        // COLOR
      }
      <ColorItem nodeEdge={nodeEdge} />
      {
        // SIZE
      }
      <h4>Size</h4>

      {
        // LABELS
      }
      <h4>Labels</h4>
    </div>
  );
};
