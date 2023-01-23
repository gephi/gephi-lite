import classNames from "classnames";
import React, { FC, ReactElement, useState } from "react";
import { ItemType } from "../../core/types";

export interface NodeEdgeProps {
  nodeEdge: ItemType;
}

export const NodeEdgeTabs: FC<{ children: ReactElement<NodeEdgeProps & unknown> }> = ({ children }) => {
  const [tab, setTab] = useState<ItemType>("nodes");
  return (
    <div>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={classNames("btn", "btn-link", "nav-link", tab === "nodes" && "active")}
            onClick={() => setTab("nodes")}
          >
            Node
          </button>
        </li>
        <li className="nav-item">
          <button
            className={classNames("btn", "btn-link", "nav-link", tab === "edges" && "active")}
            onClick={() => setTab("edges")}
          >
            Edge
          </button>
        </li>
      </ul>
      {React.cloneElement(children, { nodeEdge: tab })}
    </div>
  );
};
