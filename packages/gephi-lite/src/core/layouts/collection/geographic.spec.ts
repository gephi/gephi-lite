import { DataGraph, ItemData } from "@gephi/gephi-lite-sdk";
import { MultiGraph } from "graphology";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../appearance", () => ({ appearanceActions: { setBackgroundLayer: vi.fn() } }));
vi.mock("../../context/eventsContext", () => ({
  EVENTS: { openPanel: "openPanel" },
  emitter: { emit: vi.fn() },
}));

import { GeographicLayout } from "./geographic";

function makeGraph(
  nodes: Record<string, Record<string, unknown>>,
  edges?: Array<{ source: string; target: string }>,
): DataGraph {
  const graph = new MultiGraph() as DataGraph;
  for (const [id, attrs] of Object.entries(nodes)) graph.addNode(id, attrs as ItemData);
  for (const { source, target } of edges || []) graph.addEdge(source, target);
  return graph;
}

describe("Geographic layout", () => {
  describe("run", () => {
    it("should return empty mapping when fields are not specified", () => {
      const graph = makeGraph({ a: { lat: 48, lng: 2 } });
      expect(GeographicLayout.run(graph)).toEqual({});
      expect(GeographicLayout.run(graph, { settings: { missingStrategy: "keep" } } as never)).toEqual({});
    });

    it("should assign x=lng, y=lat with equirectangular projection", () => {
      const graph = makeGraph({
        paris: { lat: 48.85, lng: 2.35 },
        london: { lat: 51.5, lng: -0.12 },
      });
      const result = GeographicLayout.run(graph, {
        settings: {
          projection: "equirectangular",
          latitudeField: "lat",
          longitudeField: "lng",
          missingStrategy: "keep",
        },
      });
      expect(result).toEqual({
        paris: { x: 2.35, y: 48.85 },
        london: { x: -0.12, y: 51.5 },
      });
    });

    it("should apply Mercator projection with default (webmercator)", () => {
      const graph = makeGraph({ a: { lat: 45, lng: 10 } });
      const result = GeographicLayout.run(graph, {
        settings: { latitudeField: "lat", longitudeField: "lng", missingStrategy: "keep" },
      });
      // x unchanged, y is Mercator-projected (y > lat for positive latitudes)
      expect(result.a.x).toBe(10);
      expect(result.a.y).toBeGreaterThan(45);
      expect(result.a.y).toBeLessThan(90);
    });

    it("should skip nodes with non-numeric or NaN coordinates", () => {
      const graph = makeGraph({
        a: { lat: 48, lng: 2 },
        b: { lat: "not a number", lng: 2 },
        c: { lat: 48, lng: NaN },
        d: {},
      });
      const result = GeographicLayout.run(graph, {
        settings: { latitudeField: "lat", longitudeField: "lng", missingStrategy: "keep" },
      });
      expect(Object.keys(result)).toEqual(["a"]);
    });

    it("with missingStrategy='keep', should only include valid nodes", () => {
      const graph = makeGraph({
        a: { lat: 48, lng: 2 },
        b: {},
      });
      const result = GeographicLayout.run(graph, {
        settings: {
          projection: "equirectangular",
          latitudeField: "lat",
          longitudeField: "lng",
          missingStrategy: "keep",
        },
      });
      expect(result).toEqual({ a: { x: 2, y: 48 } });
    });

    it("with missingStrategy='grid', should place missing nodes on a grid", () => {
      const graph = makeGraph({
        a: { lat: 48, lng: 2 },
        b: { lat: 51, lng: -1 },
        c: {},
        d: {},
      });
      const result = GeographicLayout.run(graph, {
        settings: {
          projection: "equirectangular",
          latitudeField: "lat",
          longitudeField: "lng",
          missingStrategy: "grid",
        },
      });
      expect(result.a).toEqual({ x: 2, y: 48 });
      expect(result.b).toEqual({ x: -1, y: 51 });
      // c and d should exist and be placed to the left of the valid extent
      expect(result.c).toBeDefined();
      expect(result.d).toBeDefined();
      expect(result.c.x).toBeLessThan(-1);
      expect(result.d.x).toBeLessThan(-1);
    });

    it("with missingStrategy='barycentergrid', connected missing nodes get barycenter", () => {
      const graph = makeGraph(
        {
          a: { lat: 40, lng: 0 },
          b: { lat: 60, lng: 10 },
          c: {},
          d: {},
        },
        [
          { source: "c", target: "a" },
          { source: "c", target: "b" },
        ],
      );
      const result = GeographicLayout.run(graph, {
        settings: {
          projection: "equirectangular",
          latitudeField: "lat",
          longitudeField: "lng",
          missingStrategy: "barycentergrid",
        },
      });
      // c is connected to a and b, should be at barycenter
      expect(result.c).toEqual({ x: 5, y: 50 });
      // d has no geo neighbors, should be placed on grid
      expect(result.d).toBeDefined();
      expect(result.d.x).toBeLessThan(0);
    });

    it("should return only valid nodes when all missing nodes have no valid neighbors and missingStrategy is not grid", () => {
      const graph = makeGraph({ a: { lat: 48, lng: 2 }, b: {} });
      const resultKeep = GeographicLayout.run(graph, {
        settings: { latitudeField: "lat", longitudeField: "lng", missingStrategy: "keep" },
      });
      expect(Object.keys(resultKeep)).toEqual(["a"]);
    });

    it("should return empty mapping when no nodes have valid coords (even with grid strategy)", () => {
      const graph = makeGraph({ a: {}, b: {} });
      const result = GeographicLayout.run(graph, {
        settings: { latitudeField: "lat", longitudeField: "lng", missingStrategy: "grid" },
      });
      expect(result).toEqual({});
    });
  });

  describe("inferSettings", () => {
    it("should return empty for an empty graph", () => {
      const graph = new MultiGraph() as DataGraph;
      expect(GeographicLayout.inferSettings!(graph)).toEqual({});
    });

    it("should detect 'lat' and 'lng' fields", () => {
      const graph = makeGraph({ a: { lat: 48, lng: 2, name: "Paris" } });
      expect(GeographicLayout.inferSettings!(graph)).toEqual({
        latitudeField: "lat",
        longitudeField: "lng",
      });
    });

    it("should detect 'latitude' and 'longitude' fields", () => {
      const graph = makeGraph({ a: { latitude: 48, longitude: 2 } });
      expect(GeographicLayout.inferSettings!(graph)).toEqual({
        latitudeField: "latitude",
        longitudeField: "longitude",
      });
    });

    it("should detect 'y_coord' and 'x_coord' fields", () => {
      const graph = makeGraph({ a: { y_coord: 48, x_coord: 2 } });
      expect(GeographicLayout.inferSettings!(graph)).toEqual({
        latitudeField: "y_coord",
        longitudeField: "x_coord",
      });
    });

    it("should return undefined fields when no match found", () => {
      const graph = makeGraph({ a: { foo: 48, bar: 2 } });
      const result = GeographicLayout.inferSettings!(graph);
      expect(result.latitudeField).toBeUndefined();
      expect(result.longitudeField).toBeUndefined();
    });

    it("should ignore non-numeric fields", () => {
      const graph = makeGraph({ a: { lat: "not a number", lng: 2 } });
      const result = GeographicLayout.inferSettings!(graph);
      expect(result.latitudeField).toBeUndefined();
      expect(result.longitudeField).toBe("lng");
    });
  });
});
