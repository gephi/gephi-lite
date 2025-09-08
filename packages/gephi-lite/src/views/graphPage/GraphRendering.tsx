import { SigmaContainer } from "@react-sigma/core";
import { createNodeImageProgram } from "@sigma/node-image";
import cx from "classnames";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings } from "sigma/settings";

import GraphCaption from "../../components/GraphCaption";
import {
  ExitFullScreenIcon,
  FullScreenIcon,
  GraphSelectionModeIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ZoomResetIcon,
} from "../../components/common-icons";
import {
  useAppearance,
  useLayoutState,
  useSelection,
  useSelectionActions,
  useSigmaAtom,
  useSigmaGraph,
  useSigmaState,
} from "../../core/context/dataContexts";
import { GRAPH_SELECTION_MODES } from "../../core/selection/types";
import { resetCamera } from "../../core/sigma";
import NodeProgramBorder from "../../utils/bordered-node-program";
import { AppearanceController } from "./controllers/AppearanceController";
import { EventsController } from "./controllers/EventsController";
import { GridController } from "./controllers/GridController";
import { SelectionController } from "./controllers/SelectionController";
import { SettingsController } from "./controllers/SettingsController";

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
  const { setMode } = useSelectionActions();
  const { graphSelectionMode } = useSelection();
  const { isFullScreen, toggle } = useFullScreen();
  const sigma = useSigmaAtom();

  const btnClassName = "gl-btn gl-btn-icon gl-btn-outline bg-body";
  const zoomOptions = { duration: 200, factor: 1.5 };

  return (
    <div className="position-absolute d-flex flex-column sigma-controls gl-gap-1" style={{ right: 10, bottom: 10 }}>
      {GRAPH_SELECTION_MODES.map((mode) => (
        <button
          key={mode}
          className={cx("gl-btn gl-btn-icon", mode === graphSelectionMode ? "gl-btn-fill" : "gl-btn-outline bg-body")}
          onClick={() => setMode(mode)}
          title={t(`selection.${mode}`)}
        >
          <GraphSelectionModeIcon mode={mode} fill={mode === graphSelectionMode} />
        </button>
      ))}

      <br className="mb-2" />

      <button
        className={btnClassName}
        onClick={() => sigma.getCamera().animatedZoom(zoomOptions)}
        title={t("graph.control.zoomIn")}
      >
        <ZoomInIcon />
      </button>
      <button
        className={btnClassName}
        onClick={() => sigma.getCamera().animatedUnzoom(zoomOptions)}
        title={t("graph.control.zoomOut")}
      >
        <ZoomOutIcon />
      </button>
      <button
        className={btnClassName}
        onClick={() => resetCamera({ forceRefresh: true, source: "sigma" })}
        title={t("graph.control.zoomReset")}
      >
        <ZoomResetIcon />
      </button>
      {document.fullscreenEnabled && (
        <button
          className={btnClassName}
          onClick={() => toggle()}
          title={isFullScreen ? t("graph.control.fullscreenExit") : t("graph.control.fullscreenEnter")}
        >
          {isFullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
        </button>
      )}
    </div>
  );
};

const GraphCaptionLayer: FC = () => {
  return (
    <div className="position-absolute sigma-controls" style={{ left: 10, bottom: 10, marginRight: "4em" }}>
      <GraphCaption minimal />
    </div>
  );
};

export const GraphRendering: FC = () => {
  const { backgroundColor, layoutGridColor } = useAppearance();
  const sigmaGraph = useSigmaGraph();
  const { quality } = useLayoutState();
  const { hoveredNode, hoveredEdge, customCursor } = useSigmaState();
  const [isReady, setIsReady] = useState(false);
  const setReady = useCallback(() => {
    setIsReady(true);
  }, [setIsReady]);

  const NodeImageProgram = useMemo(
    () =>
      createNodeImageProgram({
        size: {
          mode: "max",
          value: 256,
        },
      }),
    [],
  );
  const sigmaSettings: Partial<Settings> = useMemo(
    () => ({
      labelFont: "'DM Sans', sans-serif",
      edgeLabelFont: "'DM Sans', sans-serif",
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      zIndex: true,
      minEdgeThickness: 0.3,
      itemSizesReference: "positions",
      zoomToSizeRatioFunction: (x) => x,
      defaultNodeType: "image",
      nodeProgramClasses: {
        image: NodeImageProgram,
        bordered: NodeProgramBorder,
      },
      allowInvalidContainer: true,
    }),
    [NodeImageProgram],
  );

  return (
    <>
      <SigmaContainer
        className={cx(
          !isReady && "visually-hidden",
          customCursor ? `cursor-${customCursor}` : (hoveredNode || hoveredEdge) && "cursor-pointer",
        )}
        style={{ backgroundColor }}
        graph={sigmaGraph}
        settings={sigmaSettings}
      >
        <EventsController />
        <AppearanceController />
        <SettingsController setIsReady={setReady} />
        <div className="sigma-layers">
          {quality.enabled && quality.showGrid && quality.metric?.deltaMax && (
            <GridController
              size={quality.metric.deltaMax}
              opacity={quality.metric?.cMax || 0}
              color={layoutGridColor}
            />
          )}
          <SelectionController />
        </div>
        <InteractionsController />
        <GraphCaptionLayer />
      </SigmaContainer>
    </>
  );
};
