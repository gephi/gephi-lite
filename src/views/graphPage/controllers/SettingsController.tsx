import Sigma from "sigma";
import { FC, useEffect } from "react";
import { useSigma } from "@react-sigma/core";

import { sigmaAtom } from "../../../core/sigma";
import { SigmaGraph } from "../../../core/graph/types";
import { useAppearance, useGraphDataset } from "../../../core/context/dataContexts";
import { getDrawEdgeLabel, getDrawHover, getDrawLabel } from "../../../core/appearance/utils";

export const SettingsController: FC<{ setIsReady: () => void }> = ({ setIsReady }) => {
  const sigma = useSigma();
  const graphDataset = useGraphDataset();
  const graphAppearance = useAppearance();

  useEffect(() => {
    sigmaAtom.set(sigma as Sigma<SigmaGraph>);
  }, [sigma]);

  useEffect(() => {
    sigma.setSetting("renderEdgeLabels", graphAppearance.edgesLabel.type !== "none");
    sigma.setSetting("labelRenderer", getDrawLabel(graphAppearance));
    sigma.setSetting("hoverRenderer", getDrawHover(graphAppearance));
    sigma.setSetting("edgeLabelRenderer", getDrawEdgeLabel(graphAppearance));
    setIsReady();
  }, [graphAppearance, graphDataset, setIsReady, sigma]);

  return null;
};
