import Graph from "graphology";
import { omit } from "lodash";

import { jsonDeserializer, jsonSerializer } from "./utils";

const graph = new Graph();
graph.addNode("1", { label: "1" });
graph.addNode("2", { label: "2" });
graph.addEdgeWithKey("1->2", "1", "2", { label: "1->2" });

const data = {
  number: 30.2,
  date: new Date("2024-01-01"),
  string: "test",
  boolean: false,
  set: new Set(["test_1", "test_2", "test_3"]),
  array: ["1", "2", "3"],
  function: (a: number, b: number) => a + b,
  graph: graph,
};

describe("#JSON serialisation", () => {
  it("should work", () => {
    expect(jsonSerializer(data)).toEqual({
      array: ["1", "2", "3"],
      boolean: false,
      date: { type: "Date", value: 1704067200000 },
      function: { type: "function", value: "(a, b)=>a + b" },
      graph: {
        type: "Graph",
        value: {
          attributes: {},
          edges: [{ attributes: { label: "1->2" }, key: "1->2", source: "1", target: "2" }],
          nodes: [
            { attributes: { label: "1" }, key: "1" },
            { attributes: { label: "2" }, key: "2" },
          ],
          options: { allowSelfLoops: true, multi: false, type: "mixed" },
        },
      },
      number: 30.2,
      set: { type: "Set", value: ["test_1", "test_2", "test_3"] },
      string: "test",
    });
  });

  it("deserial should match the orignal", () => {
    const serial = jsonSerializer(data);
    const deserial = jsonDeserializer<typeof data>(serial);
    expect(omit(deserial, "function")).toEqual(omit(data, "function"));
    expect(deserial.function(2, 2)).toEqual(data.function(2, 2));
  });
});
