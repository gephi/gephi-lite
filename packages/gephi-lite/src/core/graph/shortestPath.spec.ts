import Graph, { DirectedGraph, MultiGraph } from "graphology";
import { describe, expect, it } from "vitest";

import { getEdgesBetween, getShortestPathEdges } from "./utils";

/**
 * a - b - c - d
 *  \_____/
 *    (ac)
 * plus an isolated node "z".
 */
function buildGraph() {
  const graph = new Graph();
  ["a", "b", "c", "d", "z"].forEach((node) => graph.addNode(node));
  graph.addEdgeWithKey("ab", "a", "b");
  graph.addEdgeWithKey("bc", "b", "c");
  graph.addEdgeWithKey("cd", "c", "d");
  graph.addEdgeWithKey("ac", "a", "c");
  return graph;
}

describe("Graph utilities", () => {
  describe("#getEdgesBetween", () => {
    it("should find the edges linking two nodes, in either order", () => {
      const graph = buildGraph();
      expect(getEdgesBetween(graph, "a", "b")).toEqual(["ab"]);
      expect(getEdgesBetween(graph, "b", "a")).toEqual(["ab"]);
      expect(getEdgesBetween(graph, "a", "d")).toEqual([]);
    });

    it("should return every parallel edge of a multigraph", () => {
      const graph = new MultiGraph();
      graph.addNode("a");
      graph.addNode("b");
      graph.addEdgeWithKey("ab1", "a", "b");
      graph.addEdgeWithKey("ab2", "a", "b");
      expect(getEdgesBetween(graph, "a", "b").sort()).toEqual(["ab1", "ab2"]);
    });
  });

  describe("#getShortestPathEdges", () => {
    it("should return the single edge between two neighbours", () => {
      expect(getShortestPathEdges(buildGraph(), "a", "b")).toEqual(["ab"]);
    });

    it("should return the shortest of several paths", () => {
      // a-b-c-d is longer than a-c-d, which is the one expected.
      expect(getShortestPathEdges(buildGraph(), "a", "d")).toEqual(["ac", "cd"]);
    });

    it("should find the same path both ways, ordered from the node asked first", () => {
      expect(getShortestPathEdges(buildGraph(), "d", "a")).toEqual(["cd", "ac"]);
    });

    it("should return null when no path links the two nodes", () => {
      expect(getShortestPathEdges(buildGraph(), "a", "z")).toBe(null);
    });

    it("should return null when one of the nodes is unknown", () => {
      expect(getShortestPathEdges(buildGraph(), "a", "nope")).toBe(null);
    });

    it("should ignore edge direction", () => {
      // Only reachable from "a" by walking "ba" and "cb" backwards.
      const graph = new DirectedGraph();
      ["a", "b", "c"].forEach((node) => graph.addNode(node));
      graph.addEdgeWithKey("ba", "b", "a");
      graph.addEdgeWithKey("cb", "c", "b");
      expect(getShortestPathEdges(graph, "a", "c")).toEqual(["ba", "cb"]);
    });

    it("should return the self-loops of a node asked for a path to itself", () => {
      const graph = buildGraph();
      graph.addEdgeWithKey("aa", "a", "a");
      expect(getShortestPathEdges(graph, "a", "a")).toEqual(["aa"]);
      expect(getShortestPathEdges(graph, "b", "b")).toEqual([]);
    });
  });
});
