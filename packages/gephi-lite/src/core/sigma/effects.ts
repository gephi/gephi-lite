// Reset camera automatically when map mode is toggled on/off.
// Uses visualGettersAtom (not sigmaGraphAtom) because sigmaGraphAtom returns the
// same object reference and its bindEffect may not fire. For the map transition,
// Mercator extent is computed directly from dataset + visual getters so we don't
import { MERCATOR_WORLD } from "../../utils/geo";
import { appearanceAtom } from "../appearance";
import { graphDatasetAtom, visualGettersAtom } from "../graph";
import { sigmaActions } from "./actions";
import { sigmaAtom } from "./atom";
import { computeMercatorExtent, fitCameraToMercatorExtent } from "./utils";

// depend on the debounced sigmaGraphAtom rebuild.
let _prevIsMapMode: boolean | null = null;
visualGettersAtom.bindEffect((visualGetters): undefined => {
  const appearance = appearanceAtom.get();
  const isMapMode = appearance.backgroundLayer?.type === "map";
  const wasMapMode = _prevIsMapMode;
  _prevIsMapMode = isMapMode;
  if (wasMapMode === null || wasMapMode === isMapMode) return;

  if (!isMapMode) {
    sigmaActions.resetCamera({ forceRefresh: true });
    return;
  }

  const sigma = sigmaAtom.get();
  const dataset = graphDatasetAtom.get();
  if (visualGetters.getNodePosition) {
    fitCameraToMercatorExtent(sigma, computeMercatorExtent(dataset.layout, visualGetters.getNodePosition));
  } else {
    sigma.setCustomBBox(MERCATOR_WORLD);
    sigma.getCamera().setState({ angle: 0, x: 0.5, y: 0.5, ratio: 1 });
  }
  sigma.refresh();
});
