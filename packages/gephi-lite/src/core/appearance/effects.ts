import { serializeAppearanceState } from "@gephi/gephi-lite-sdk";

import { sessionStorage } from "../../utils/storage";
import { layoutActions } from "../layouts/actions";
import { GeographicLayout } from "../layouts/collection/geographic";
import { preferencesActions } from "../preferences/actions";
import { sessionAtom } from "../session/atom";
import { appearanceAtom } from "./atom";

appearanceAtom.bind((appearanceState, previousAppearanceState) => {
  sessionStorage.setItem("appearance", serializeAppearanceState(appearanceState));

  // update color mapping LRU
  if (previousAppearanceState.nodesColor !== appearanceState.nodesColor) {
    if (appearanceState.nodesColor.type === "partition" || appearanceState.nodesColor.type === "ranking") {
      preferencesActions.newColorPaletteUsage(appearanceState.nodesColor);
    }
  }
  if (previousAppearanceState.edgesColor !== appearanceState.edgesColor) {
    if (appearanceState.edgesColor.type === "partition" || appearanceState.edgesColor.type === "ranking") {
      preferencesActions.newColorPaletteUsage(appearanceState.edgesColor);
    }
  }

  if (previousAppearanceState.backgroundLayer !== appearanceState.backgroundLayer) {
    if (appearanceState.backgroundLayer?.map) {
      // When map style on appearance changed, save it into preferences
      if (appearanceState.backgroundLayer.map.style) {
        preferencesActions.setMapStyle(appearanceState.backgroundLayer.map.style);
      }

      // When scaling ratio changed and last layout ran is geo, we reapply it with the good scale
      if (
        sessionAtom.get().lastLayout === GeographicLayout.id &&
        previousAppearanceState.backgroundLayer?.map.scale !== appearanceState.backgroundLayer.map.scale
      ) {
        const layoutParameters = sessionAtom.get().layoutsParameters[GeographicLayout.id];
        layoutActions.startLayout(GeographicLayout.id, {
          ...layoutParameters,
          scale: appearanceState.backgroundLayer.map.scale,
        });
      }
    }
  }
});
