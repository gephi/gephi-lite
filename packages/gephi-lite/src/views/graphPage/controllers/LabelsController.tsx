import { getLabelsCount } from "@gephi/gephi-lite-sdk";
import { useSigma } from "@react-sigma/core";
import { FC, useEffect } from "react";

import { useAppearance, useSelection, useSigmaState } from "../../../core/context/dataContexts";
import { GephiLiteSigma } from "../../../core/graph/types";
import { applyNodeLabelsBudget } from "../../../core/sigma/labels";
import { getEmphasizedNodes } from "../../../core/sigma/utils";

/**
 * Keeps the number of node labels rendered at once within the configured budget, refreshed on each
 * frame so that it always describes the visible part of the graph (see `applyNodeLabelsBudget`).
 */
export const LabelsController: FC = () => {
  const sigma = useSigma() as GephiLiteSigma;
  const { nodesLabelSize } = useAppearance();
  const selection = useSelection();
  const { emphasizedNodes, hoveredNode } = useSigmaState();

  useEffect(() => {
    // While some nodes are emphasized, they are the only ones labelled (their labels are forced by
    // the appearance reducer), so there is no budget to spend:
    const emphasized = getEmphasizedNodes({ graph: sigma.getGraph(), selection, hoveredNode, emphasizedNodes });

    return applyNodeLabelsBudget(sigma, {
      labelsCount: getLabelsCount(nodesLabelSize),
      enabled: !emphasized.size,
    });
  }, [emphasizedNodes, hoveredNode, nodesLabelSize, selection, sigma]);

  return null;
};
