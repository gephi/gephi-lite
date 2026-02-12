import { SigmaContainer } from "@react-sigma/core";
import { createNodeImageProgram } from "@sigma/node-image";
import cx from "classnames";
import { FC, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings } from "sigma/settings";

import GraphCaption from "../../components/GraphCaption";
import {
  ExitFullScreenIcon,
  FullScreenIcon,
  GraphSelectionModeIcon,
  LayoutsIcon,
  PauseIconFill,
  PlayIcon,
  PlaySyncIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ZoomResetIcon,
} from "../../components/common-icons";
import {
  useAppearance,
  useLayoutActions,
  useLayoutState,
  useSelection,
  useSelectionActions,
  useSessionData,
  useSigmaAtom,
  useSigmaGraph,
  useSigmaState,
} from "../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../core/context/eventsContext";
import { LAYOUTS } from "../../core/layouts/collection";
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
  const { emitter } = useEventsContext();
  const { setMode } = useSelectionActions();
  const { graphSelectionMode } = useSelection();
  const { isFullScreen, toggle } = useFullScreen();
  const sigma = useSigmaAtom();
  const layoutState = useLayoutState();
  const { startLayout, stopLayout } = useLayoutActions();
  const session = useSessionData();

  const btnClassName = "gl-btn gl-btn-icon gl-btn-outline bg-body";
  const zoomOptions = { duration: 200, factor: 1.5 };

  // Is layout is running ?
  const isLayoutRunning = useMemo(() => {
    return layoutState.type === "running";
  }, [layoutState.type]);

  // Get the latest layout run in the history with its data
  const lastLayoutActive = useMemo(() => {
    if (!session.lastLayout) return null;
    const layoutId = session.lastLayout;
    
    // Special case for layout quality
    if(layoutId === "layout-quality") 
      return {
      id: "quality",
      name: t(`layouts.${layoutId}.title`),
      type: "quality",
      params:{}
    }

    const layout = LAYOUTS.find((e) => e.id === layoutId);
    if (!layout) return null;

    return {
      id: layout.id,
      name: t(`layouts.${layout.id}.title`),
      type: layout.type,
      params: session.layoutsParameters[layout.id] || {},
    };
  }, [session.lastLayout, session.layoutsParameters, t]);

  // Get needed info to render the layout button
  const layoutButton = useMemo(() => {
    let result: { title: string; icon: ReactNode; disabled: boolean; className: string } = {
      title: t("graph.control.layout-no-layout"),
      icon: <PlayIcon />,
      disabled: true,
      className: "gl-btn gl-btn-icon gl-btn-outline",
    };
    if (lastLayoutActive) {
      if (isLayoutRunning) {
        result = {
          title: t("graph.control.layout-stop-latest", { name: lastLayoutActive.name }),
          icon: <PauseIconFill />,
          disabled: false,
          className: "gl-btn gl-btn-icon gl-btn-fill",
        };
      } else {
        if (lastLayoutActive.type === "sync") {
          result = {
            title: t("graph.control.layout-run-latest", { name: lastLayoutActive.name }),
            icon: <PlaySyncIcon />,
            disabled: false,
            className: "gl-btn gl-btn-icon gl-btn-outline bg-body",
          };
        } else if (lastLayoutActive.type === "quality") {
          result = {
            title: t("graph.control.layout-run-latest", { name: lastLayoutActive.name }),
            icon: <PlaySyncIcon />,
            disabled: true,
            className: "gl-btn gl-btn-icon gl-btn-outline bg-body",
          };
        } else {
          result = {
            title: t("graph.control.layout-start-latest", { name: lastLayoutActive.name }),
            icon: <PlayIcon />,
            disabled: false,
            className: "gl-btn gl-btn-icon gl-btn-outline bg-body",
          };
        }
      }
    }
    return result;
  }, [lastLayoutActive, isLayoutRunning, t]);

  // Start / stop action for the layout button
  const startStopLayout = useCallback(() => {
    if (isLayoutRunning) stopLayout();
    else if (lastLayoutActive) {
      startLayout(lastLayoutActive.id, lastLayoutActive.params);
    }
  }, [startLayout, stopLayout, isLayoutRunning, lastLayoutActive]);

  // Open the settings of the latest layout
  // Default is FA2
  const openMenuItem = useCallback(() => {
    const layoutId = lastLayoutActive ? lastLayoutActive.id : "fa2";
    emitter.emit(EVENTS.openMenu, { menuId: `layout-${layoutId}` });
  }, [emitter, lastLayoutActive]);

  // When the component is unmounted
  // => stop the layout
  useEffect(() => {
    return () => {
      stopLayout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="position-absolute d-flex sigma-controls gl-gap-2" style={{ right: 10, bottom: 10 }}>
      <div className="d-flex flex-column gl-gap-1">
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
          className={layoutButton.className}
          onClick={startStopLayout}
          disabled={layoutButton.disabled}
          title={layoutButton.title}
        >
          {layoutButton.icon}
        </button>

        <button
          className={cx("gl-btn gl-btn-icon gl-btn-outline bg-body")}
          onClick={openMenuItem}
          title={t("graph.control.layout-open-settings", {
            name: lastLayoutActive ? lastLayoutActive.name : t("layouts.fa2.title"),
          })}
        >
          <LayoutsIcon />
        </button>

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

const NodeImageProgram = createNodeImageProgram({
  size: {
    mode: "max",
    value: 256,
  },
});
const sigmaSettings: Partial<Settings> = {
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
