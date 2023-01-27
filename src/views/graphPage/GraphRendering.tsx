import Sigma from "sigma";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SigmaContainer, useSigma, ControlsContainer, ZoomControl, FullScreenControl } from "@react-sigma/core";

import { useAppearance, useGraphDataset, useSigmaGraph } from "../../core/context/dataContexts";
import { getDrawEdgeLabel, getDrawHover, getDrawLabel, getReducer } from "../../core/appearance/utils";
import { sigmaAtom } from "../../core/graph";
import { SigmaGraph } from "../../core/graph/types";
import cx from "classnames";

const SettingsController: FC<{ setIsReady: () => void }> = ({ setIsReady }) => {
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
    setIsReady();
  }, [graphAppearance, graphDataset, sigma, setIsReady]);

  return null;
};

export const GraphRendering: FC = () => {
  const { t } = useTranslation();
  const sigmaGraph = useSigmaGraph();
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="stage">
      <SigmaContainer className={cx("position-absolute inset-0", !isReady && "visually-hidden")} graph={sigmaGraph}>
        <SettingsController setIsReady={() => setIsReady(true)} />

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
