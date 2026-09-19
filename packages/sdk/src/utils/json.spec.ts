import Graph from "graphology";
import { describe, expect, it } from "vitest";

import { gephiLiteParse, gephiLiteStringify } from "./json";

const CLASSIC_DATASET = {
  name: "John Doe",
  age: 42,
  isHuman: true,
  links: [{ url: "http://somewhere.com", label: "somewhere" }],
  favoriteMovie: null,
};
const CLASSIC_DATASET_STRING =
  '{"name":"John Doe","age":42,"isHuman":true,"links":[{"url":"http://somewhere.com","label":"somewhere"}],"favoriteMovie":null}';

const SETS_DATASET = {
  abc: {
    numbersSet: new Set([123, 456, 789]),
    stringsSet: new Set(["abc", "def", "ghi"]),
    objectsSet: new Set([{ abc: 123 }, [false, true]]),
  },
};
const SETS_DATASET_STRING =
  '{"abc":{"numbersSet":["<<SET","[123,456,789]","SET>>"],"stringsSet":["<<SET","[\\"abc\\",\\"def\\",\\"ghi\\"]","SET>>"],"objectsSet":["<<SET","[{\\"abc\\":123},[false,true]]","SET>>"]}}';

describe("JSON utilities", () => {
  describe("#parse and #stringify together", () => {
    it("should work with 'classic' data", () => {
      expect(gephiLiteParse(gephiLiteStringify(CLASSIC_DATASET))).toEqual(CLASSIC_DATASET);
    });

    it("should work with sets", () => {
      expect(gephiLiteParse(gephiLiteStringify(SETS_DATASET))).toEqual(SETS_DATASET);
    });

    it("should work with graphs", () => {
      const graph = new Graph();
      graph.addNode("a", { label: "A" });
      graph.addNode("b");
      graph.addEdgeWithKey("ab", "a", "b", { weight: 2 });
      const parsed = gephiLiteParse<Graph>(gephiLiteStringify(graph));
      expect(parsed).toBeInstanceOf(Graph);
      expect(parsed.nodes().sort()).toEqual(["a", "b"]);
      expect(parsed.edges()).toEqual(["ab"]);
      expect(parsed.getNodeAttribute("a", "label")).toBe("A");
    });

    it("should keep an object merely keyed by item type as a plain object", () => {
      // Anything but arrays under `nodes`/`edges` is not a serialized graph: mistaking one for a
      // graph throws inside the reviver, which used to drop the whole parsed document.
      const byItemType = { selectionSort: { nodes: "alphabetical", edges: "size" }, theme: "dark" };
      expect(gephiLiteParse(gephiLiteStringify(byItemType))).toEqual(byItemType);
    });
  });

  describe("#stringify", () => {
    it("should work with 'classic' data", () => {
      expect(gephiLiteStringify(CLASSIC_DATASET)).toBe(CLASSIC_DATASET_STRING);
    });

    it("should work with sets", () => {
      expect(gephiLiteStringify(SETS_DATASET)).toBe(SETS_DATASET_STRING);
    });
  });

  describe("#parse", () => {
    it("should work with 'classic' data", () => {
      expect(gephiLiteParse(CLASSIC_DATASET_STRING)).toEqual(CLASSIC_DATASET);
    });

    it("should work with sets", () => {
      expect(gephiLiteParse(SETS_DATASET_STRING)).toEqual(SETS_DATASET);
    });
  });
});
