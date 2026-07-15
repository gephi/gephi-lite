import { useSigma } from "@react-sigma/core";
import { LngLatBounds, Map, MercatorCoordinate, StyleSpecification } from "maplibre-gl";
import { FC, useCallback, useEffect, useRef } from "react";

import { useAppearance, usePreferences } from "../../../core/context/dataContexts";
import { getDefaultMapStyle } from "../../../utils/map-style";

// Convert graph coordinates (with Y-flip) to geo coordinates
function graphToLatlng(coords: { x: number; y: number }) {
  const mercator = new MercatorCoordinate(coords.x, 1 - coords.y, 0);
  return mercator.toLngLat();
}

export const MapLayerController: FC = () => {
  const sigma = useSigma();
  const { theme } = usePreferences();
  const { backgroundLayer } = useAppearance();

  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastCameraStateRef = useRef<string | null>(null);
  const sigmaRef = useRef(sigma);
  sigmaRef.current = sigma;

  const mapConfig = backgroundLayer?.type === "map" ? backgroundLayer.map : null;
  const mapStyle = (mapConfig?.style || getDefaultMapStyle(theme)) as StyleSpecification;
  const styleKey = JSON.stringify(mapStyle);

  // Sync map bounds to match sigma's viewport (skips if camera hasn't moved)
  const syncMapFromSigma = useCallback(() => {
    const map = mapRef.current;
    const s = sigmaRef.current;
    if (!map) return;

    const { x, y, ratio, angle } = s.getCamera().getState();
    const key = `${x},${y},${ratio},${angle}`;
    if (key === lastCameraStateRef.current) return;
    lastCameraStateRef.current = key;

    const dims = s.getDimensions();
    const bottomLeft = s.viewportToGraph({ x: 0, y: dims.height }, { padding: 0 });
    const topRight = s.viewportToGraph({ x: dims.width, y: 0 }, { padding: 0 });

    const southWest = graphToLatlng(bottomLeft);
    const northEast = graphToLatlng(topRight);

    map.fitBounds(new LngLatBounds(southWest, northEast), { duration: 0 });
  }, []);

  // Initialize or clean up map based on mapConfig
  const isMapMode = !!mapConfig;
  useEffect(() => {
    if (!isMapMode) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.remove();
        containerRef.current = null;
      }
      return;
    }

    // Create container for MapLibre
    const sigmaContainer = sigmaRef.current.getContainer();
    if (!containerRef.current) {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.inset = "0";
      container.style.pointerEvents = "none";
      container.style.zIndex = "-1";
      sigmaContainer.insertBefore(container, sigmaContainer.firstChild);
      containerRef.current = container;
    }

    // Create MapLibre map
    const style = JSON.parse(styleKey) as StyleSpecification;
    const map = new Map({
      container: containerRef.current,
      style,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;

    map.once("load", () => syncMapFromSigma());

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.remove();
        containerRef.current = null;
      }
    };
  }, [isMapMode, styleKey, syncMapFromSigma]);

  // Sync map camera on sigma afterRender
  useEffect(() => {
    if (!isMapMode) return;
    const s = sigmaRef.current;

    const handler = () => syncMapFromSigma();
    s.on("afterRender", handler);
    return () => {
      s.off("afterRender", handler);
    };
  }, [isMapMode, syncMapFromSigma]);

  // Handle resize
  useEffect(() => {
    if (!isMapMode || !mapRef.current) return;

    const handleResize = () => {
      mapRef.current?.resize();
      syncMapFromSigma();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMapMode, syncMapFromSigma]);

  return null;
};
