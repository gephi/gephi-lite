import classNames from "classnames";
import React, { ComponentType, FC, ReactNode, useState } from "react";
import { chunk } from "lodash";

export interface Tab {
  value: string;
  content: ComponentType;
}

export const Tabs: FC<{ children: [ReactNode, ReactNode, ...ReactNode[]] }> = ({ children }) => {
  const tabs = chunk(children, 2) as [ReactNode, ReactNode][];

  if (children.length % 2) throw new Error("Tabs: This component should have an even number of children.");

  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);

  return (
    <div>
      <ul className="nav nav-tabs">
        {tabs.map((tab, i) => (
          <li className="nav-item" key={i}>
            <button
              className={classNames("btn", "btn-link", "nav-link", currentTabIndex === i && "active")}
              onClick={() => setCurrentTabIndex(i)}
            >
              {tab[0]}
            </button>
          </li>
        ))}
      </ul>
      {tabs[currentTabIndex][1]}
    </div>
  );
};
