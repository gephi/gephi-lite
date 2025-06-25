import { describe, expect, it } from "vitest";

import { castScalarToModelValue } from "../graph/fieldModel";
import { filterValue } from "./utils";

describe("Filters utilities", () => {
  describe("#filterValue", () => {
    it("should work as expected with ranges", () => {
      expect(filterValue(150, { type: "range", min: 100, max: 200 })).toBe(true);
      expect(filterValue(50, { type: "range", min: 100, max: 200 })).toBe(false);
      expect(filterValue(250, { type: "range", min: 100, max: 200 })).toBe(false);

      expect(filterValue(150, { type: "range", min: 100 })).toBe(true);
      expect(filterValue(50, { type: "range", min: 100 })).toBe(false);
      expect(filterValue(250, { type: "range", min: 100 })).toBe(true);

      expect(filterValue(150, { type: "range", max: 200 })).toBe(true);
      expect(filterValue(50, { type: "range", max: 200 })).toBe(true);
      expect(filterValue(250, { type: "range", max: 200 })).toBe(false);

      expect(
        filterValue(castScalarToModelValue("150", { type: "number" }), { type: "range", min: 100, max: 200 }),
      ).toBe(true);
      expect(filterValue(castScalarToModelValue("50", { type: "number" }), { type: "range", min: 100, max: 200 })).toBe(
        false,
      );
      expect(
        filterValue(castScalarToModelValue("250", { type: "number" }), { type: "range", min: 100, max: 200 }),
      ).toBe(false);

      expect(filterValue(castScalarToModelValue(null, { type: "number" }), { type: "range", min: 100, max: 200 })).toBe(
        false,
      );
      expect(
        filterValue(castScalarToModelValue(null, { type: "number" }), {
          type: "range",
          min: 100,
          max: 200,
          keepMissingValues: true,
        }),
      ).toBe(true);
    });

    it("should work as expected with terms", () => {
      const terms = new Set(["toto", "tata", "tutu"]);

      expect(filterValue("toto", { type: "terms", terms })).toBe(true);
      expect(filterValue(["bidule", "toto"], { type: "terms", terms })).toBe(true);
      expect(filterValue("tonton", { type: "terms", terms })).toBe(false);
      expect(filterValue(["bidule", "machin"], { type: "terms", terms })).toBe(false);

      expect(filterValue(castScalarToModelValue(null, { type: "category" }), { type: "terms", terms })).toBe(false);
      expect(
        filterValue(castScalarToModelValue(null, { type: "category" }), {
          type: "terms",
          terms,
          keepMissingValues: true,
        }),
      ).toBe(true);
    });
  });
});
