export const DEFAULT_MAP_STYLE = {
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
      id: "background",
      type: "background",
      paint: { "background-color": "#f5f5f5" },
    },
    {
      id: "countries-fill",
      type: "fill",
      source: "demotiles",
      "source-layer": "countries",
      paint: { "fill-color": "#ffffff" },
    },
    {
      id: "countries-boundary",
      type: "line",
      source: "demotiles",
      "source-layer": "countries",
      paint: { "line-color": "#dee2e6", "line-width": 1 },
    },
    {
      id: "geolines",
      type: "line",
      source: "demotiles",
      "source-layer": "geolines",
      paint: { "line-color": "#dee2e6", "line-width": 1.5 },
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
        "text-color": "#adb5bd",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    },
  ],
} as const;

export function getDefaultMapStyle(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(DEFAULT_MAP_STYLE));
}
