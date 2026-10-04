import { FieldModel, getEmptyAppearanceState, getEmptyGraphDataset } from "@gephi/gephi-lite-sdk";
import { describe, expect, it } from "vitest";

import { DynamicItemData, GraphDataset } from "../graph/types";
import { makeGetNumberAttr } from "./utils";

// A star graph: n0 is the hub (degree 4), n1-n4 are leaves (degree 1 each) - so "degree" (a
// dynamic, topology-based attribute) spans 1 to 4 across the whole graph.
function buildDataset(): GraphDataset {
  const dataset = getEmptyGraphDataset();
  ["n0", "n1", "n2", "n3", "n4"].forEach((n) => dataset.fullGraph.addNode(n));
  dataset.fullGraph.addEdge("n0", "n1");
  dataset.fullGraph.addEdge("n0", "n2");
  dataset.fullGraph.addEdge("n0", "n3");
  dataset.fullGraph.addEdge("n0", "n4");
  // A plain static attribute, present on every node regardless of any filter:
  ["n0", "n1", "n2", "n3", "n4"].forEach((n, i) => {
    dataset.nodeData[n] = { weight: (i + 1) * 10 };
  });
  dataset.nodeFields = [{ id: "weight", itemType: "nodes", type: "number" }];
  return dataset;
}

const degreeField: FieldModel<"nodes", true> = { id: "degree", itemType: "nodes", type: "number", dynamic: true };
const weightField: FieldModel<"nodes", false> = { id: "weight", itemType: "nodes", type: "number" };

describe("appearance utilities", () => {
  describe("#makeGetNumberAttr ranking size, filterAware toggle", () => {
    const dataset = buildDataset();
    // Simulates a Filters panel keeping only the two leaves n1 and n2: they're only connected to
    // each other through the hub n0, which the filter excludes, so the filtered induced subgraph
    // has no edge between them - both read as degree 0 there. The dynamic data channel is scoped to
    // just those two, exactly like the real `dynamicItemDataAtom`.
    const filteredDynamicNodeData: DynamicItemData["dynamicNodeData"] = {
      n1: { degree: 0 },
      n2: { degree: 0 },
    };
    const dynamicItemData: DynamicItemData = {
      dynamicNodeData: filteredDynamicNodeData,
      dynamicNodeFields: [degreeField],
      dynamicEdgeData: {},
      dynamicEdgeFields: [],
    };

    it("default (unchecked): dynamic field scale spans the whole graph, not just the filtered items", () => {
      const appearance = {
        ...getEmptyAppearanceState(),
        nodesSize: { type: "ranking" as const, field: degreeField, missingSize: 1, minSize: 10, maxSize: 100 },
      };
      const getSize = makeGetNumberAttr("nodes", "size", dataset, dynamicItemData, appearance);
      expect(getSize).not.toBeNull();
      // The scale must span the real, whole-graph degree range (1 to 4: n1-n4 are leaves, n0 is the
      // hub), not the filtered pair's own values (which are both 0 - that would collapse the scale
      // to a single degenerate point instead of a 1-to-4 range).
      expect(getSize!({ static: {}, dynamic: { degree: 1 } })).toBeCloseTo(10);
      expect(getSize!({ static: {}, dynamic: { degree: 4 } })).toBeCloseTo(100);
      expect(getSize!({ static: {}, dynamic: { degree: 2.5 } })).toBeCloseTo(55);
    });

    it("checked: dynamic field scale is restricted to the currently filtered items", () => {
      const appearance = {
        ...getEmptyAppearanceState(),
        nodesSize: {
          type: "ranking" as const,
          field: degreeField,
          missingSize: 1,
          minSize: 10,
          maxSize: 100,
          filterAware: true,
        },
      };
      const getSize = makeGetNumberAttr("nodes", "size", dataset, dynamicItemData, appearance);
      // Both filtered items have degree 0 -> delta is 0 -> falls back to the historical `|| 1` guard,
      // so a degree-0 item lands exactly on minSize, unlike the whole-graph scale above where it
      // would map to something below minSize (0 sits under the real range's floor of 1).
      expect(getSize!({ static: {}, dynamic: { degree: 0 } })).toBeCloseTo(10);
    });

    it("default (unchecked): a plain static field is unaffected either way (already whole-dataset)", () => {
      const appearance = {
        ...getEmptyAppearanceState(),
        nodesSize: { type: "ranking" as const, field: weightField, missingSize: 1, minSize: 10, maxSize: 100 },
      };
      const getSize = makeGetNumberAttr("nodes", "size", dataset, dynamicItemData, appearance);
      // weight spans 10 (n0) to 50 (n4) across the whole dataset.
      expect(getSize!({ static: { weight: 10 }, dynamic: {} })).toBeCloseTo(10);
      expect(getSize!({ static: { weight: 50 }, dynamic: {} })).toBeCloseTo(100);
    });

    it("checked: a static field's scale becomes restricted to the currently filtered items too", () => {
      const appearance = {
        ...getEmptyAppearanceState(),
        nodesSize: {
          type: "ranking" as const,
          field: weightField,
          missingSize: 1,
          minSize: 10,
          maxSize: 100,
          filterAware: true,
        },
      };
      const getSize = makeGetNumberAttr("nodes", "size", dataset, dynamicItemData, appearance);
      // Filtered subset is n1 (weight 20) and n2 (weight 30): the scale must span only [20, 30], so
      // n2's weight (30) now maps to maxSize, unlike the whole-dataset case above where 30 would sit
      // well below the top (50).
      expect(getSize!({ static: { weight: 20 }, dynamic: {} })).toBeCloseTo(10);
      expect(getSize!({ static: { weight: 30 }, dynamic: {} })).toBeCloseTo(100);
    });
  });
});
