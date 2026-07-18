import { useSigma } from "@react-sigma/core";
import { FC, useEffect } from "react";
import { drawDiscNodeLabel, drawStraightEdgeLabel } from "sigma/rendering";
import { DEFAULT_SETTINGS, Settings } from "sigma/settings";

import { getDrawEdgeLabel, getDrawNodeLabel } from "../../../core/appearance/utils";
import { useAppearance, useGraphDataset, usePreferences } from "../../../core/context/dataContexts";
import { getAppliedTheme } from "../../../core/preferences/utils";
import { GephiLiteSigma, consumePendingFocus, resetCamera, sigmaAtom } from "../../../core/sigma";
import { drawDiscNodeHover } from "../../../core/sigma/utils";
import { inputToStateThreshold } from "../../../utils/labels";

export const SettingsController: FC<{ setIsReady: () => void }> = ({ setIsReady }) => {
  const sigma = useSigma() as GephiLiteSigma;
  const graphDataset = useGraphDataset();
  const graphAppearance = useAppearance();
  const { theme } = usePreferences();

  useEffect(() => {
    sigmaAtom.set(sigma);
    resetCamera({ forceRefresh: true });
    // If we arrived here from a "locate" action on another page (e.g. the data table), replay the
    // pending focus now that sigma is mounted and the graph has been framed.
    consumePendingFocus();
  }, [sigma]);

  useEffect(() => {
    const mode = getAppliedTheme(theme);
    sigma.setSetting("labelColor", { color: mode === "dark" ? "#FFF" : "#000" });
    sigma.setSetting("edgeLabelColor", { color: mode === "dark" ? "#495057" : "#CCC" });
    sigma.setSetting("nodeHoverBackgroundColor" as keyof Settings, mode === "dark" ? "#000" : "#FFF");
    // Edge labels are always rendered: even with no field selected, the edge id is displayed
    // (see makeGetStringAttr), so there is no "no label" case left to skip rendering for.
    sigma.setSetting("renderEdgeLabels", true);
    sigma.setSetting("zIndex", graphAppearance.edgesZIndex.type !== "none");
    sigma.setSetting("defaultDrawNodeLabel", getDrawNodeLabel(graphAppearance, drawDiscNodeLabel));
    sigma.setSetting("defaultDrawNodeHover", getDrawNodeLabel(graphAppearance, drawDiscNodeHover));
    sigma.setSetting("defaultDrawEdgeLabel", getDrawEdgeLabel(graphAppearance, drawStraightEdgeLabel));

    const labelThreshold = inputToStateThreshold(graphAppearance.nodesLabelSize.density);
    const labelDensity = labelThreshold === 0 ? Infinity : DEFAULT_SETTINGS.labelDensity;
    sigma.setSetting("labelRenderedSizeThreshold", labelThreshold);
    sigma.setSetting("labelDensity", labelDensity);

    setIsReady();
  }, [graphAppearance, graphDataset, setIsReady, sigma, theme]);

  return null;
};
