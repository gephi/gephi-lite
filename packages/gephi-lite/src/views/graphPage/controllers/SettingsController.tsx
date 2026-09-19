import { useSigma } from "@react-sigma/core";
import { debounce } from "lodash";
import { FC, useEffect } from "react";
import { drawDiscNodeLabel, drawStraightEdgeLabel } from "sigma/rendering";
import { Settings } from "sigma/settings";

import { getDrawEdgeLabel, getDrawNodeLabel } from "../../../core/appearance/utils";
import { useAppearance, useGraphDataset, usePreferences } from "../../../core/context/dataContexts";
import { getAppliedTheme } from "../../../core/preferences/utils";
import { GephiLiteSigma, consumePendingFocus, restoreCamera, saveCameraState, sigmaAtom } from "../../../core/sigma";
import { drawDiscNodeHover } from "../../../core/sigma/utils";

// Panning and zooming emit a camera update on every frame: only the resting position is stored.
const CAMERA_PERSIST_DEBOUNCE = 300;

export const SettingsController: FC<{ setIsReady: () => void }> = ({ setIsReady }) => {
  const sigma = useSigma() as GephiLiteSigma;
  const graphDataset = useGraphDataset();
  const graphAppearance = useAppearance();
  const { theme } = usePreferences();

  useEffect(() => {
    sigmaAtom.set(sigma);
    // Frames the graph, and comes back to the view this tab was left on if there is one (page
    // reload, or a tab the browser discarded and restored).
    restoreCamera({ forceRefresh: true });
    // If we arrived here from a "locate" action on another page (e.g. the data table), replay the
    // pending focus now that sigma is mounted and the graph has been framed.
    consumePendingFocus();

    // Remember where the user leaves the camera, so the next load can come back to it. Debounced:
    // panning and zooming emit this on every frame.
    const camera = sigma.getCamera();
    const persistCameraState = debounce(() => saveCameraState(camera.getState()), CAMERA_PERSIST_DEBOUNCE);
    camera.on("updated", persistCameraState);
    return () => {
      persistCameraState.cancel();
      camera.off("updated", persistCameraState);
    };
  }, [sigma]);

  useEffect(() => {
    const mode = getAppliedTheme(theme);
    sigma.setSetting("labelColor", { color: mode === "dark" ? "#FFF" : "#000" });
    sigma.setSetting("edgeLabelColor", { color: mode === "dark" ? "#495057" : "#CCC" });
    sigma.setSetting("nodeHoverBackgroundColor" as keyof Settings, mode === "dark" ? "#000" : "#FFF");
    sigma.setSetting("renderEdgeLabels", graphAppearance.edgesLabel.type !== "none");
    sigma.setSetting("zIndex", graphAppearance.edgesZIndex.type !== "none");
    sigma.setSetting("defaultDrawNodeLabel", getDrawNodeLabel(graphAppearance, drawDiscNodeLabel));
    sigma.setSetting("defaultDrawNodeHover", getDrawNodeLabel(graphAppearance, drawDiscNodeHover));
    sigma.setSetting("defaultDrawEdgeLabel", getDrawEdgeLabel(graphAppearance, drawStraightEdgeLabel));

    // Labels are not picked by sigma anymore, but by LabelsController: an unreachable size
    // threshold disables sigma's own selection, leaving only the labels we force.
    sigma.setSetting("labelRenderedSizeThreshold", Infinity);

    setIsReady();
  }, [graphAppearance, graphDataset, setIsReady, sigma, theme]);

  return null;
};
