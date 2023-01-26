import Sigma from "sigma";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SigmaContainer, useSigma, ControlsContainer, ZoomControl, FullScreenControl } from "@react-sigma/core";

import { useAppearance, useGraphDataset, useSigmaGraph } from "../../core/context/dataContexts";
import { getDrawEdgeLabel, getDrawHover, getDrawLabel, getReducer } from "../../core/appearance/utils";
import { sigmaAtom } from "../../core/graph";
import { SigmaGraph } from "../../core/graph/types";

const SettingsController: FC = () => {
  const sigma = useSigma();
  const graphDataset = useGraphDataset();
  const graphAppearance = useAppearance();

  useEffect(() => {
    sigmaAtom.set(sigma as Sigma<SigmaGraph>);
  }, [sigma]);

  useEffect(() => {
    sigma.setSetting("renderEdgeLabels", graphAppearance.edgesLabel.type !== "none");
    sigma.setSetting("nodeReducer", getReducer("nodes", sigma, graphDataset, graphAppearance));
    sigma.setSetting("edgeReducer", getReducer("edges", sigma, graphDataset, graphAppearance));
    sigma.setSetting("labelRenderer", getDrawLabel(graphAppearance));
    sigma.setSetting("hoverRenderer", getDrawHover(graphAppearance));
    sigma.setSetting("edgeLabelRenderer", getDrawEdgeLabel(graphAppearance));
  }, [graphAppearance, graphDataset, sigma]);

  return null;
};

export const GraphRendering: FC = () => {
  const { t } = useTranslation();
  const sigmaGraph = useSigmaGraph();

  return (
    <div className="stage">
      <SigmaContainer
        className="position-absolute inset-0"
        graph={sigmaGraph}
        settings={{
          allowInvalidContainer: true,
        }}
      >
        <SettingsController />

        <ControlsContainer position={"bottom-right"}>
          <ZoomControl
            labels={{
              zoomIn: t("graph.control.zoomIn").toString(),
              zoomOut: t("graph.control.zoomOut").toString(),
              reset: t("graph.control.zoomReset").toString(),
            }}
          />
          <FullScreenControl
            labels={{
              enter: t("graph.control.fullscreenEnter").toString(),
              exit: t("graph.control.fullscreenExit").toString(),
            }}
          />
        </ControlsContainer>
      </SigmaContainer>
    </div>
  );
};
