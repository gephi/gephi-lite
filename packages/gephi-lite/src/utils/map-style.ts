import { Preferences } from "../core/preferences/types";
import { getAppliedTheme } from "../core/preferences/utils";

const lightTheme = {
  country: "#FFF",
  countryBorder: "#dee2e6",
  countryLabelColor: "#adb5bd",
  countryLabelHaloColor: "#ffffff",
};

const darkTheme: typeof lightTheme = {
  country: "#333333",
  countryBorder: "#dee2e6",
  countryLabelColor: "#adb5bd",
  countryLabelHaloColor: "#333333",
};

export function getDefaultMapStyle(theme: Preferences["theme"]): Record<string, unknown> {
  const applyTheme = getAppliedTheme(theme);
  const colors = applyTheme === "dark" ? darkTheme : lightTheme;
  return {
    version: 8,
    name: "Gephi Lite Default",
    sources: {
      demotiles: {
        type: "vector",
        url: "https://demotiles.maplibre.org/tiles/tiles.json",
      },
    },
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    layers: [
      {
        id: "countries-fill",
        type: "fill",
        source: "demotiles",
        "source-layer": "countries",
        paint: { "fill-color": colors.country },
      },
      {
        id: "countries-boundary",
        type: "line",
        source: "demotiles",
        "source-layer": "countries",
        paint: { "line-color": colors.countryBorder, "line-width": 1 },
      },
      {
        id: "geolines",
        type: "line",
        source: "demotiles",
        "source-layer": "geolines",
        paint: { "line-color": colors.countryBorder, "line-width": 1.5 },
      },
      {
        id: "country-labels",
        type: "symbol",
        source: "demotiles",
        "source-layer": "centroids",
        layout: {
          "text-field": "{NAME}",
          "text-font": ["Open Sans Semibold"],
          "text-size": 12,
        },
        paint: {
          "text-color": colors.countryLabelColor,
          "text-halo-color": colors.countryLabelHaloColor,
          "text-halo-width": 1.5,
        },
      },
    ],
  };
}
