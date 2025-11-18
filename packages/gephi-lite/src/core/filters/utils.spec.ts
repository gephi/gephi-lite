import { FieldModel } from "@gephi/gephi-lite-sdk";
import { describe, expect, it } from "vitest";

import { castScalarToQuantifiableValue } from "../graph/fieldModel";
import { filterValue } from "./utils";

describe("Filters utilities", () => {
  const dateField: FieldModel<"nodes", false, "date"> = {
    id: "f",
    type: "date",
    itemType: "nodes",
    format: "yyyy-MM",
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
});
