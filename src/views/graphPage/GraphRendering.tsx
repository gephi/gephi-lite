import cx from "classnames";
import { useTranslation } from "react-i18next";
import { SigmaContainer } from "@react-sigma/core";
import { Settings } from "sigma/settings";
import React, { FC, useCallback, useEffect, useState } from "react";

import { FaRegDotCircle } from "react-icons/fa";
import { BsZoomIn, BsZoomOut } from "react-icons/bs";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";

import { useSigmaAtom, useSigmaGraph, useSigmaState } from "../../core/context/dataContexts";
import { AppearanceController } from "./controllers/AppearanceController";
import { SettingsController } from "./controllers/SettingsController";
import { MarqueeController } from "./controllers/MarqueeController";
import { EventsController } from "./controllers/EventsController";
import NodeProgramBorder from "../../utils/bordered-node-program";
import { resetCamera } from "../../core/sigma";
import GraphCaption from "../../components/GraphCaption";

function useFullScreen(): { toggle: () => void; isFullScreen: boolean } {
  const [isFullScreen, setFullScreen] = useState<boolean>(false);
  const container = document.body;

  useEffect(() => {
    const toggleState = () => setFullScreen((v) => !v);
    document.addEventListener("fullscreenchange", toggleState);
    return () => document.removeEventListener("fullscreenchange", toggleState);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement !== container) {
      container.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [container]);

  return {
    toggle,
    isFullScreen,
  };
}

const InteractionsController: FC = () => {
  const { t } = useTranslation();
  const { isFullScreen, toggle } = useFullScreen();
  const sigma = useSigmaAtom();

  const btnClassName = "btn btn-ico btn-dark btn-sm mt-1";
  const zoomOptions = { duration: 200, factor: 1.5 };

  return (
    <div className="position-absolute d-flex flex-column sigma-controls" style={{ right: 10, bottom: 10 }}>
      <button
        className={btnClassName}
        onClick={() => sigma.getCamera().animatedZoom(zoomOptions)}
        title={t("graph.control.zoomIn").toString()}
      >
        <BsZoomIn />
      </button>
      <button
        className={btnClassName}
        onClick={() => sigma.getCamera().animatedUnzoom(zoomOptions)}
        title={t("graph.control.zoomOut").toString()}
      >
        <BsZoomOut />
      </button>
      <button
        className={btnClassName}
        onClick={() => resetCamera({ forceRefresh: true, source: "sigma" })}
        title={t("graph.control.zoomReset").toString()}
      >
        <FaRegDotCircle />
      </button>
      <button
        className={btnClassName}
        onClick={() => toggle()}
        title={
          isFullScreen ? t("graph.control.fullscreenExit").toString() : t("graph.control.fullscreenEnter").toString()
        }
      >
        {isFullScreen ? <AiOutlineFullscreenExit /> : <AiOutlineFullscreen />}
      </button>
    </div>
  );
};

const GraphCaptionLayer: FC = () => {
  return (
    <div className="position-absolute sigma-controls" style={{ left: 10, bottom: 10 }}>
      <GraphCaption minimal />
    </div>
  );
};

export const GraphRendering: FC = () => {
  const sigmaGraph = useSigmaGraph();
  const { hoveredNode, hoveredEdge } = useSigmaState();
  const [isReady, setIsReady] = useState(false);
  const setReady = useCallback(() => {
    setIsReady(true);
  }, [setIsReady]);

  return (
    <>
      <SigmaContainer
        className={cx(
          "position-absolute inset-0",
          !isReady && "visually-hidden",
          (hoveredNode || hoveredEdge) && "cursor-pointer",
        )}
        graph={sigmaGraph}
        settings={
          {
            labelFont: "Poppins, Arial, Helvetica, Geneva",
            edgeLabelFont: "Poppins, Arial, Helvetica, Geneva",
            enableEdgeHoverEvents: "debounce",
            enableEdgeClickEvents: true,
            renderEdgeLabels: true,
            zIndex: true,
            itemSizesReference: "positions",
            zoomToSizeRatioFunction: (x) => x,
            nodeProgramClasses: {
              circle: NodeProgramBorder,
            },
          } as Partial<Settings>
        }
      >
        <EventsController />
        <AppearanceController />
        <SettingsController setIsReady={setReady} />
        <div className="sigma-layers">
          <MarqueeController />
        </div>
      </SigmaContainer>
      <InteractionsController />
      <GraphCaptionLayer />
    </>
  );
};
