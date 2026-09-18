import { AppearanceState } from "@gephi/gephi-lite-sdk";

import { LayoutState } from "../core/layouts/types";

export const MERCATOR_WORLD = { x: [0, 1] as [number, number], y: [0, 1] as [number, number] };
export const MERCATOR_PAN_BOUNDS = { x: [-1, 2] as [number, number], y: [0, 1] as [number, number] };
export const MERCATOR_SIZE_RATIO = 1 / 360;

/**
 * Map feature is eligble only if we run a geographic layout with a webmercator projector.
 * With other projection, maplibre doesn't work.
 */
export function isMapFeatureAuthorized(layoutState: LayoutState): boolean {
  return layoutState.lastRun &&
    layoutState.lastRun.layoutId === "geographic" &&
    layoutState.lastRun.params.projection === "webmercator"
    ? true
    : false;
}

/**
 * Check if the map background is displayed.
 * It can only be case when the brackground layer is enabled and of type map.
 */
export function isMapEnabled(appearance: AppearanceState): boolean {
  return appearance.backgroundLayer && appearance.backgroundLayer.type === "map" && appearance.backgroundLayer.enabled
    ? true
    : false;
}
