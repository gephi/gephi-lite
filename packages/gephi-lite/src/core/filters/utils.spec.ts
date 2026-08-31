import { FieldModel } from "@gephi/gephi-lite-sdk";
import { MultiGraph } from "graphology";
import { describe, expect, it } from "vitest";

import { castScalarToQuantifiableValue } from "../graph/fieldModel";
import { initializeGraphDataset } from "../graph/utils";
import { filterGraph, filterValue, inRangeIncluded } from "./utils";

describe("Filters utilities", () => {
  const dateField: FieldModel<"nodes", false, "date"> = {
    id: "f",
    type: "date",
    itemType: "nodes",
    format: "yyyy-MM",
  };
  const dateEdgesField: FieldModel<"edges", false, "date"> = {
    id: "createdAt",
    type: "date",
    itemType: "edges",
    format: "yyyy-MM-dd",
  };
  const numberNodesField: FieldModel<"nodes", false, "number"> = { id: "f", type: "number", itemType: "nodes" };
  const numberEdgesField: FieldModel<"edges", false, "number"> = { id: "f", type: "number", itemType: "edges" };
  describe("#filterValue", () => {
    it("should work as expected with ranges", () => {
      expect(filterValue(150, { type: "range", min: 100, max: 200, field: numberNodesField })).toBe(true);
      expect(filterValue(50, { type: "range", min: 100, max: 200, field: numberNodesField })).toBe(false);
      expect(filterValue(250, { type: "range", min: 100, max: 200, field: numberNodesField })).toBe(false);

      expect(filterValue(150, { type: "range", min: 100, field: numberEdgesField })).toBe(true);
      expect(filterValue(50, { type: "range", min: 100, field: numberEdgesField })).toBe(false);
      expect(filterValue(250, { type: "range", min: 100, field: numberEdgesField })).toBe(true);

      expect(filterValue(150, { type: "range", max: 200, field: numberNodesField })).toBe(true);
      expect(filterValue(50, { type: "range", max: 200, field: numberNodesField })).toBe(true);
      expect(filterValue(250, { type: "range", max: 200, field: numberNodesField })).toBe(false);

      expect(
        filterValue("150", {
          type: "range",
          min: 100,
          max: 200,
          field: numberEdgesField,
        }),
      ).toBe(true);
      expect(filterValue("50", { type: "range", min: 100, max: 200, field: numberEdgesField })).toBe(false);
      expect(
        filterValue("250", {
          type: "range",
          min: 100,
          max: 200,
          field: numberEdgesField,
        }),
      ).toBe(false);

      expect(filterValue(null, { type: "range", min: 100, max: 200, field: numberEdgesField })).toBe(false);
      expect(
        filterValue(null, {
          type: "range",
          min: 100,
          max: 200,
          keepMissingValues: true,
          field: numberNodesField,
        }),
      ).toBe(true);

      // dates

      expect(
        filterValue("2025-01", {
          type: "range",
          min: castScalarToQuantifiableValue("2023-01", dateField),
          max: castScalarToQuantifiableValue("2026-01", dateField),
          field: dateField,
        }),
      ).toBe(true);
      expect(
        filterValue("2020-01", {
          type: "range",
          min: castScalarToQuantifiableValue("2023-01", dateField),
          max: castScalarToQuantifiableValue("2026-01", dateField),
          field: dateField,
        }),
      ).toBe(false);
      expect(
        // date in not expected format
        filterValue("01/02/2024", {
          type: "range",
          min: castScalarToQuantifiableValue("2023-01", dateField),
          max: castScalarToQuantifiableValue("2026-01", dateField),

          field: dateField,
        }),
      ).toBe(false);
      expect(
        // date in not expected format
        filterValue("01/02/2024", {
          type: "range",
          min: castScalarToQuantifiableValue("2023-01", dateField),
          max: castScalarToQuantifiableValue("2026-01", dateField),
          keepMissingValues: true,
          field: dateField,
        }),
      ).toBe(true);

      expect(
        filterValue("2025-01-15", {
          type: "range",
          min: castScalarToQuantifiableValue("2025-01-15", dateEdgesField),
          max: castScalarToQuantifiableValue("2025-01-15", dateEdgesField),
          field: dateEdgesField,
        }),
      ).toBe(true);
    });

    it("should handle zero and negative range bounds", () => {
      expect(inRangeIncluded(0, 0, 0)).toBe(true);
      expect(inRangeIncluded(-1, 0, undefined)).toBe(false);
      expect(inRangeIncluded(1, undefined, 0)).toBe(false);

      const timestampZero = castScalarToQuantifiableValue("1970-01-01", dateEdgesField);
      const beforeEpoch = castScalarToQuantifiableValue("1969-12-31", dateEdgesField);
      expect(timestampZero).toBeDefined();
      expect(
        filterValue("1970-01-01", {
          type: "range",
          min: timestampZero,
          max: timestampZero,
          field: dateEdgesField,
        }),
      ).toBe(true);
      expect(filterValue("1969-12-31", { type: "range", min: timestampZero, field: dateEdgesField })).toBe(false);
      expect(beforeEpoch).toBeLessThan(0);
    });

    it("should work as expected with terms", () => {
      const terms = new Set(["toto", "tata", "tutu"]);
      const fieldCategory: FieldModel<"nodes", false, "category"> = { id: "f", type: "category", itemType: "nodes" };
      const fieldKeywords: FieldModel<"edges", false, "keywords"> = {
        id: "f",
        type: "keywords",
        itemType: "edges",
        separator: "|",
      };
      const fieldBoolean: FieldModel<"nodes", false, "boolean"> = { id: "b", type: "boolean", itemType: "nodes" };

      expect(filterValue("toto", { type: "terms", terms, field: fieldCategory })).toBe(true);
      expect(filterValue("bidule|toto", { type: "terms", terms, field: fieldKeywords })).toBe(true);
      expect(filterValue("tonton", { type: "terms", terms, field: fieldCategory })).toBe(false);
      expect(filterValue("bidule|machin", { type: "terms", terms, field: fieldCategory })).toBe(false);

      expect(filterValue(null, { type: "terms", terms, field: fieldCategory })).toBe(false);
      expect(
        filterValue(null, {
          type: "terms",
          terms,
          // keepMissingValues is ignored for category
          keepMissingValues: true,
          field: fieldCategory,
        }),
      ).toBe(false);
      expect(
        filterValue(null, {
          type: "terms",
          terms: new Set(["toto", "tata", null]),
          field: fieldCategory,
        }),
      ).toBe(true);
      expect(
        filterValue(true, {
          type: "terms",
          terms: new Set([true]),
          field: fieldBoolean,
        }),
      ).toBe(true);
      expect(
        filterValue(false, {
          type: "terms",
          terms: new Set([true]),
          field: fieldBoolean,
        }),
      ).toBe(false);
      expect(
        filterValue(false, {
          type: "terms",
          terms: new Set([false]),
          field: fieldBoolean,
        }),
      ).toBe(true);
      expect(
        filterValue(null, {
          type: "terms",
          terms: new Set([false, null]),
          field: fieldBoolean,
        }),
      ).toBe(true);
      expect(
        filterValue(null, {
          type: "terms",
          terms: new Set([true, false]),
          field: fieldBoolean,
        }),
      ).toBe(false);
    });
  });

  describe("#filterGraph", () => {
    it("filters edge dates inclusively while preserving all nodes and edge topology", () => {
      const graph = new MultiGraph({ type: "directed" });
      ["n1", "n2", "n3", "n4", "n5"].forEach((node) => graph.addNode(node));
      graph.addDirectedEdgeWithKey("before", "n1", "n2", { createdAt: "2024-12-31" });
      graph.addDirectedEdgeWithKey("lower", "n2", "n3", { createdAt: "2025-01-01" });
      graph.addDirectedEdgeWithKey("upper", "n3", "n4", { createdAt: "2025-01-31" });
      graph.addDirectedEdgeWithKey("missing", "n4", "n5", {});
      graph.addDirectedEdgeWithKey("invalid", "n1", "n5", { createdAt: "not-a-date" });
      const dataset = initializeGraphDataset(graph, { edgeFields: [dateEdgesField] });

      const filtered = filterGraph(
        dataset.fullGraph,
        dataset,
        {
          type: "range",
          itemType: "edges",
          field: dateEdgesField,
          min: castScalarToQuantifiableValue("2025-01-01", dateEdgesField),
          max: castScalarToQuantifiableValue("2025-01-31", dateEdgesField),
        },
        [],
      );

      expect(filtered.nodes()).toEqual(dataset.fullGraph.nodes());
      expect(filtered.edges()).toEqual(["lower", "upper"]);
      expect(filtered.source("lower")).toBe("n2");
      expect(filtered.target("lower")).toBe("n3");
      expect(filtered.isDirected("lower")).toBe(true);
    });

    it("optionally keeps missing and invalid edge dates", () => {
      const graph = new MultiGraph();
      graph.addNode("n1");
      graph.addNode("n2");
      graph.addEdgeWithKey("valid", "n1", "n2", { createdAt: "2025-01-15" });
      graph.addEdgeWithKey("missing", "n1", "n2");
      graph.addEdgeWithKey("invalid", "n1", "n2", { createdAt: "invalid" });
      const dataset = initializeGraphDataset(graph, { edgeFields: [dateEdgesField] });

      const filtered = filterGraph(
        dataset.fullGraph,
        dataset,
        {
          type: "range",
          itemType: "edges",
          field: dateEdgesField,
          keepMissingValues: true,
          min: castScalarToQuantifiableValue("2025-01-01", dateEdgesField),
          max: castScalarToQuantifiableValue("2025-01-31", dateEdgesField),
        },
        [],
      );

      expect(new Set(filtered.edges())).toEqual(new Set(["valid", "missing", "invalid"]));
    });
  });
});
