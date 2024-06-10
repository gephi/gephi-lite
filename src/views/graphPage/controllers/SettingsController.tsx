import { useSigma } from "@react-sigma/core";
import { FC, useEffect } from "react";
import { drawDiscNodeHover, drawDiscNodeLabel, drawStraightEdgeLabel } from "sigma/rendering";
import { DEFAULT_SETTINGS } from "sigma/settings";

import { getDrawEdgeLabel, getNodeDrawFunction } from "../../../core/appearance/utils";
import { useAppearance, useGraphDataset } from "../../../core/context/dataContexts";
import { GephiLiteSigma, resetCamera, sigmaAtom } from "../../../core/sigma";
import { inputToStateThreshold } from "../../../utils/labels";

export const SettingsController: FC<{ setIsReady: () => void }> = ({ setIsReady }) => {
  const sigma = useSigma() as GephiLiteSigma;
  const graphDataset = useGraphDataset();
  const graphAppearance = useAppearance();

  useEffect(() => {
    sigmaAtom.set(sigma);
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
