import { FieldModel } from "@gephi/gephi-lite-sdk";
import { describe, expect, it } from "vitest";

import { filterValue } from "./utils";

describe("Filters utilities", () => {
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

      expect(filterValue("toto", { type: "terms", terms, field: fieldCategory })).toBe(true);
      expect(filterValue("bidule|toto", { type: "terms", terms, field: fieldKeywords })).toBe(true);
      expect(filterValue("tonton", { type: "terms", terms, field: fieldCategory })).toBe(false);
      expect(filterValue("bidule|machin", { type: "terms", terms, field: fieldCategory })).toBe(false);

      expect(filterValue(null, { type: "terms", terms, field: fieldCategory })).toBe(false);
      expect(
        filterValue(null, {
          type: "terms",
          terms,
          keepMissingValues: true,
          field: fieldCategory,
        }),
      ).toBe(true);
    });
  });
});
