import { FieldModel } from "@gephi/gephi-lite-sdk";
import { describe, expect, it } from "vitest";

import { buildRangeMetric, createAttributeFilter } from "./utils";

describe("GraphFilters utilities", () => {
  describe("#buildRangeMetric", () => {
    it("supports zero, negative values and deduplicated slider values", () => {
      const metric = buildRangeMetric([0, -100, 100, 0]);

      expect(metric).toBeDefined();
      expect(metric?.values).toEqual([-100, 0, 100]);
      expect(metric?.ranges.flatMap((range) => range.values)).toEqual([-100, 0, 0, 100]);
    });

    it("supports a single value", () => {
      const metric = buildRangeMetric([0]);

      expect(metric).toMatchObject({ min: 0, max: 0, step: 1, values: [0], maxCount: 1 });
    });

    it("returns undefined when there are no finite values", () => {
      expect(buildRangeMetric([])).toBeUndefined();
      expect(buildRangeMetric([Number.NaN, Number.POSITIVE_INFINITY])).toBeUndefined();
    });
  });

  describe("#createAttributeFilter", () => {
    it("creates an enabled range filter for an edge date field", () => {
      const field: FieldModel<"edges", false, "date"> = {
        id: "createdAt",
        itemType: "edges",
        type: "date",
        format: "yyyy-MM-dd",
      };

      expect(createAttributeFilter("edges", field)).toEqual({
        type: "range",
        itemType: "edges",
        field,
        keepMissingValues: true,
      });
    });
  });
});
