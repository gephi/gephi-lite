import classNames from "classnames";
import React, { FC, ReactElement, useState } from "react";

export type NodeEdge = "node" | "edge";
export interface NodeEdgeProps {
  nodeEdge: NodeEdge;
}

export const NodeEdgeTabs: FC<{ children: ReactElement<NodeEdgeProps & unknown> }> = ({ children }) => {
  const [tab, setTab] = useState<NodeEdge>("node");
  return (
    <div>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={classNames("btn", "btn-link", "nav-link", tab === "node" && "active")}
            onClick={() => setTab("node")}
          >
            Node
          </button>
        </li>
        <li className="nav-item">
          <button
            className={classNames("btn", "btn-link", "nav-link", tab === "edge" && "active")}
            onClick={() => setTab("edge")}
          >
            Edge
          </button>
        </li>
      </ul>
      {React.cloneElement(children, { nodeEdge: tab })}
    </div>
  );
};
