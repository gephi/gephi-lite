import { geoEqualEarth, geoNaturalEarth1 } from "d3-geo";

export type GeoProjectionType = "webmercator" | "equirectangular" | "equalearth" | "naturalearth1";

const SCALE = 180 / Math.PI;
const D3_PROJECTIONS = {
  naturalearth1: geoNaturalEarth1().scale(SCALE).translate([0, 0]),
  equalearth: geoEqualEarth().scale(SCALE).translate([0, 0]),
} as const;

export function applyGeoProjection(lng: number, lat: number, projection: GeoProjectionType): { x: number; y: number } {
  switch (projection) {
    case "webmercator":
      return { x: lng, y: SCALE * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) };
    case "equirectangular":
      return { x: lng, y: lat };
    case "equalearth":
    case "naturalearth1": {
      const result = D3_PROJECTIONS[projection]([lng, lat]);
      return result ? { x: result[0], y: -result[1] } : { x: lng, y: lat };
    }
  }
}
