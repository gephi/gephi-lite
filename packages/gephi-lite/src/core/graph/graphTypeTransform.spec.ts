import { MultiGraph } from "graphology";
import { describe, expect, it } from "vitest";

import { setGraphType, transformGraphType } from "./graphTypeTransform";
import { getEmptyGraphDataset } from "./utils";

function getMixedGraph() {
  const graph = new MultiGraph({ type: "mixed" });
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addDirectedEdgeWithKey("a->b", "a", "b");
  graph.addUndirectedEdgeWithKey("b--c", "b", "c");
  return graph;
}

describe("transformGraphType", () => {
  it("preserves edge directions when transforming to mixed", () => {
    const graph = getMixedGraph();
    const transformedGraph = transformGraphType(graph, "mixed");

    expect(transformedGraph.type).toBe("mixed");
    expect(transformedGraph.nodes()).toEqual(["a", "b", "c"]);
    expect(transformedGraph.isDirected("a->b")).toBe(true);
    expect(transformedGraph.isUndirected("b--c")).toBe(true);
  });

  it("converts every edge to directed when transforming to directed", () => {
    const graph = getMixedGraph();
    const transformedGraph = transformGraphType(graph, "directed");

    expect(transformedGraph.type).toBe("directed");
    expect(transformedGraph.isDirected("a->b")).toBe(true);
    expect(transformedGraph.isDirected("b--c")).toBe(true);
  });

  it("converts every edge to undirected when transforming to undirected", () => {
    const graph = getMixedGraph();
    const transformedGraph = transformGraphType(graph, "undirected");

    expect(transformedGraph.type).toBe("undirected");
    expect(transformedGraph.isUndirected("a->b")).toBe(true);
    expect(transformedGraph.isUndirected("b--c")).toBe(true);
  });
});

describe("setGraphType", () => {
  it("returns the same dataset when the graph already has the requested type", () => {
    const dataset = getEmptyGraphDataset({ graphType: "mixed" });

    expect(setGraphType("mixed")(dataset)).toBe(dataset);
  });

  it("replaces only the full graph when changing type", () => {
    const dataset = getEmptyGraphDataset({ graphType: "mixed" });
    dataset.fullGraph = getMixedGraph();
    dataset.nodeData = { a: { label: "A" } };

    const nextDataset = setGraphType("directed")(dataset);

    expect(nextDataset).not.toBe(dataset);
    expect(nextDataset.fullGraph).not.toBe(dataset.fullGraph);
    expect(nextDataset.fullGraph.type).toBe("directed");
    expect(nextDataset.nodeData).toBe(dataset.nodeData);
  });
});
