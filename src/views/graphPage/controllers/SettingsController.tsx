import Sigma from "sigma";
import { FC, useEffect } from "react";
import { useSigma } from "@react-sigma/core";
import { DEFAULT_SETTINGS } from "sigma/settings";
import { drawStraightEdgeLabel } from "sigma/rendering/edge-labels";
import { drawDiscNodeLabel } from "sigma/rendering/node-labels";
import { drawDiscNodeHover } from "sigma/rendering/node-hover";

import { SigmaGraph } from "../../../core/graph/types";
import { resetCamera, sigmaAtom } from "../../../core/sigma";
import { inputToStateThreshold } from "../../../utils/labels";
import { useAppearance, useGraphDataset } from "../../../core/context/dataContexts";
import { getDrawEdgeLabel, getNodeDrawFunction } from "../../../core/appearance/utils";

export const SettingsController: FC<{ setIsReady: () => void }> = ({ setIsReady }) => {
  const sigma = useSigma();
  const graphDataset = useGraphDataset();
  const graphAppearance = useAppearance();

  useEffect(() => {
    sigmaAtom.set(sigma as Sigma<SigmaGraph>);
    resetCamera({ forceRefresh: true });
  }, [sigma]);

  useEffect(() => {
    sigma.setSetting("renderEdgeLabels", graphAppearance.edgesLabel.type !== "none");
    sigma.setSetting("defaultDrawNodeLabel", getNodeDrawFunction(graphAppearance, drawDiscNodeLabel));
    sigma.setSetting("defaultDrawNodeHover", getNodeDrawFunction(graphAppearance, drawDiscNodeHover));
    sigma.setSetting("defaultDrawEdgeLabel", getDrawEdgeLabel(graphAppearance, drawStraightEdgeLabel));

    const labelThreshold = inputToStateThreshold(graphAppearance.nodesLabelSize.density);
    const labelDensity = labelThreshold === 0 ? Infinity : DEFAULT_SETTINGS.labelDensity;
    sigma.setSetting("labelRenderedSizeThreshold", labelThreshold);
    sigma.setSetting("labelDensity", labelDensity);

    setIsReady();
  }, [graphAppearance, graphDataset, setIsReady, sigma]);

  return null;
};
