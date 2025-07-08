import React from "react";
import { FC } from "react";

import { useSelection } from "../../../core/context/dataContexts";
import { LassoController } from "./LassoController";
import { MarqueeController } from "./MarqueeController";

export const SelectionController: FC = () => {
  const { graphSelectionMode } = useSelection();

  if (graphSelectionMode === "marquee") return <MarqueeController />;
  if (graphSelectionMode === "lasso") return <LassoController />;

  return null;
};
