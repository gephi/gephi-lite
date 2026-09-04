import { DataGraph } from "@gephi/gephi-lite-sdk";
import { useTranslation } from "react-i18next";

import { GeoProjectionType, applyGeoProjection } from "../../../utils/geo-projections";
import { EVENTS, useEventsContext } from "../../context/eventsContext";
import { LayoutMapping, OneShotLayout } from "../types";

const LAT_RE = /^(lat|latitude|y_?coord)$/i;
const LNG_RE = /^(lng|lon|long|longitude|x_?coord)$/i;

export type MissingStrategy = "keep" | "grid" | "barycentergrid";

export interface GeographicLayoutSettings {
  projection?: GeoProjectionType;
  latitudeField?: string;
  longitudeField?: string;
  missingStrategy: MissingStrategy;
}

function computeGridPositions(
  nodeIds: string[],
  extent: { minX: number; maxX: number; minY: number; maxY: number },
): LayoutMapping {
  const result: LayoutMapping = {};
  if (nodeIds.length === 0) return result;

  const width = extent.maxX - extent.minX || 1;
  const height = extent.maxY - extent.minY || 1;
  const cols = Math.ceil(Math.sqrt(nodeIds.length));
  const spacing = Math.min(width, height) / Math.max(cols, 1);
  const offsetX = extent.minX - width * 0.2 - cols * spacing;
  const startY = (extent.minY + extent.maxY) / 2 - (Math.ceil(nodeIds.length / cols) * spacing) / 2;

  nodeIds.forEach((nodeId, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    result[nodeId] = { x: offsetX + col * spacing, y: startY + row * spacing };
  });
  return result;
}

export function runGeographic(graph: DataGraph, options?: { settings: GeographicLayoutSettings }): LayoutMapping {
  const {
    projection = "webmercator",
    latitudeField,
    longitudeField,
    missingStrategy = "keep",
  } = options?.settings || {};
  const result: LayoutMapping = {};

  if (!latitudeField || !longitudeField) return result;

  const validIds: string[] = [];
  const missingIds: string[] = [];

  graph.forEachNode((nodeId, attrs) => {
    const lat = attrs[latitudeField];
    const lng = attrs[longitudeField];
    if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
      result[nodeId] = applyGeoProjection(lng, lat, projection);
      validIds.push(nodeId);
    } else {
      missingIds.push(nodeId);
    }
  });

  if (missingStrategy === "keep" || missingIds.length === 0 || validIds.length === 0) return result;

  // Compute extent of geolocated nodes
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const id of validIds) {
    const { x, y } = result[id];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const extent = { minX, maxX, minY, maxY };

  if (missingStrategy === "grid") {
    Object.assign(result, computeGridPositions(missingIds, extent));
  } else if (missingStrategy === "barycentergrid") {
    const validSet = new Set(validIds);
    const gridIds: string[] = [];

    for (const nodeId of missingIds) {
      const geoNeighbors = graph.neighbors(nodeId).filter((n) => validSet.has(n));
      if (geoNeighbors.length > 0) {
        let sx = 0,
          sy = 0;
        for (const n of geoNeighbors) {
          sx += result[n].x;
          sy += result[n].y;
        }
        result[nodeId] = { x: sx / geoNeighbors.length, y: sy / geoNeighbors.length };
      } else {
        gridIds.push(nodeId);
      }
    }

    Object.assign(result, computeGridPositions(gridIds, extent));
  }

  return result;
}

function inferGeographicSettings(dataGraph: DataGraph): Partial<GeographicLayoutSettings> {
  if (dataGraph.order === 0) return {};
  const sample = dataGraph.getNodeAttributes(dataGraph.nodes()[0]);
  const numericKeys = Object.keys(sample).filter((k) => typeof sample[k] === "number");
  return {
    latitudeField: numericKeys.find((k) => LAT_RE.test(k)),
    longitudeField: numericKeys.find((k) => LNG_RE.test(k)),
  };
}

export const GeographicLayout = {
  id: "geographic",
  type: "oneshot",
  description: true,
  hideReset: true,
  inferSettings: inferGeographicSettings,
  parameters: [
    {
      id: "projection",
      type: "enum",
      options: [{ id: "webmercator" }, { id: "equirectangular" }, { id: "equalearth" }, { id: "naturalearth1" }],
      defaultValue: "webmercator",
      description: true,
    },
    {
      id: "latitudeField",
      type: "attribute",
      itemType: "nodes",
      restriction: ["number"],
      required: true,
      description: true,
    },
    {
      id: "longitudeField",
      type: "attribute",
      itemType: "nodes",
      restriction: ["number"],
      required: true,
      description: true,
    },
    {
      id: "missingStrategy",
      type: "enum",
      options: [{ id: "keep" }, { id: "grid" }, { id: "barycentergrid" }],
      defaultValue: "keep",
      description: true,
    },
    {
      id: "background",
      type: "jsx",
      Component: () => {
        const { t } = useTranslation();
        const { emitter } = useEventsContext();
        return (
          <div className="panel-block">
            <p className="gl-text-muted mb-0">{t("layouts.geographic.background_warning")}</p>
            <button
              type="button"
              className="gl-btn gl-btn-outline"
              onClick={() => emitter.emit(EVENTS.openMenu, { menuId: "appearance-background" })}
            >
              {t("layouts.geographic.background_open")}
            </button>
          </div>
        );
      },
    },
  ],
  run: runGeographic,
} as OneShotLayout<GeographicLayoutSettings>;
