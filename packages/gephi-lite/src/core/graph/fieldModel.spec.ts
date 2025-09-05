import { shuffle } from "lodash";
import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { castScalarToModelValue, guessSeparator, inferFieldType, serializeModelValueToScalar } from "./fieldModel";

describe("Field Model", () => {
  describe("#inferFieldType", () => {
    it("should properly handle a list of differing numbers", () => {
      expect(inferFieldType("foobar", [123, -123, 456, 789, Infinity], 5)).toEqual({
        type: "number",
      });
    });

    it("should properly handle a list of differing strings", () => {
      expect(inferFieldType("foobar", ["Alexis", "Benoit", "Paul", "Guillaume", "Mathieu"], 5)).toEqual({
        type: "text",
      });
    });

    it("should properly handle a list of repeating strings", () => {
      expect(inferFieldType("foobar", ["Nantes", "Nantes", "Nantes", "Paris", "Paris"], 5)).toEqual({
        type: "category",
      });
    });

    it("should properly handle a list of repeating numbers", () => {
      expect(inferFieldType("foobar", [44, 44, 44, 75, 75], 5)).toEqual({
        type: "number",
      });
    });

    // categories as numbers
    it("should properly handle a list of repeating numbers from 1 in series", () => {
      const numbersFromSeriesRepeating = shuffle([1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 6, 6, 7]);
      expect(inferFieldType("foobar", numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "category",
      });
    });
    it("should properly handle a list of repeating numbers from 0 in series", () => {
      const numbersFromSeriesRepeating = shuffle([0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 6, 6, 7]);
      expect(inferFieldType("foobar", numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "category",
      });
    });
    it("should properly handle a list of repeating numbers in almost series", () => {
      const numbersFromSeriesRepeating = shuffle([0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 6, 6, 7, 10]);
      expect(inferFieldType("foobar", numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "number",
      });
    });
    it("should properly handle a list of repeating numbers in almost series", () => {
      const numbersFromSeriesRepeating = shuffle([2, 2, 3, 4, 5, 5, 5, 6, 6, 7, 10]);
      expect(inferFieldType("foobar", numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "number",
      });
    });

    // Booleans:
    it("should properly detect strings booleans", () => {
      expect(inferFieldType("foobar", ["true", "true", "true", "false", "false"], 5)).toEqual({
        type: "boolean",
      });
    });
    it("should properly detect number booleans", () => {
      expect(inferFieldType("foobar", [1, 1, 1, 0, 0], 5)).toEqual({
        type: "boolean",
      });
    });
    it("should properly detect actual booleans", () => {
      expect(inferFieldType("foobar", [true, true, true, false, false], 5)).toEqual({
        type: "boolean",
      });
    });

    it("should properly detect separators", () => {
      expect(
        inferFieldType(
          "foobar",
          ["TypeScript", "Neo4J,TypeScript", "Python,TypeScript", "TypeScript,Python", "TypeScript"],
          5,
        ),
      ).toEqual({
        type: "keywords",
        separator: ",",
      });
    });

    it("should not detect date when there is no consensual format", () => {
      expect(
        inferFieldType(
          "foobar",
          ["2025-06", "2023", "2012-06-03", "2012-05-25", "2025-07-25", "2025-06-24T15:30:21.907Z"],
          6,
        ),
      ).toEqual({
        type: "text",
      });
    });
    it("should properly detect date and format", () => {
      expect(inferFieldType("foobar", ["2025", "2023", "2012", "2013", "2023", "2023"], 6)).toEqual({
        type: "date",
        format: "yyyy",
      });
    });
    it("should properly detect date and format", () => {
      expect(inferFieldType("foobar", ["2025-06-24T15:30:21.907Z"], 1)).toEqual({
        type: "date",
        format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
      });
    });
    it("should properly detect date and format", () => {
      expect(
        inferFieldType("foobar", ["2025/05/06", "2023/05/08", "2012/12/31", "2012/12/01", "2021/11/03"], 5),
      ).toEqual({
        type: "date",
        format: "yyyy/MM/dd",
      });
    });
    it("should properly detect wrong date and format", () => {
      expect(
        inferFieldType("foobar", ["2025/05/06", "2023/05/08", "2012/12/32", "2012/12/01", "2021/11/03"], 5),
      ).toEqual({
        type: "text",
      });
    });
  });

  describe("#guessSeparator", () => {
    it("should properly detect classic detectors", () => {
      expect(
        guessSeparator([
          "TypeScript",
          "Neo4J,TypeScript",
          "Python,TypeScript",
          "TypeScript,Python",
          "TypeScript",
          "TypeScript",
        ]),
      ).toEqual(",");
    });
  });

  describe("#castScalarToModelValue", () => {
    it("should properly cast integer", () => {
      expect(castScalarToModelValue("12", { type: "number" })).toEqual(12);
    });
    it("should properly cast integer", () => {
      expect(castScalarToModelValue(12, { type: "number" })).toEqual(12);
    });
    it("should properly cast float", () => {
      expect(castScalarToModelValue("1.3", { type: "number" })).toEqual(1.3);
    });
    it("should properly cast float", () => {
      expect(castScalarToModelValue(1.3, { type: "number" })).toEqual(1.3);
    });
    it("should properly cast scientific notation", () => {
      expect(castScalarToModelValue("1e5", { type: "number" })).toEqual(1e5);
    });
    it("should properly cast NaN to undefined", () => {
      expect(castScalarToModelValue("notANumber", { type: "number" })).toEqual(undefined);
    });
    it("should properly cast text", () => {
      expect(castScalarToModelValue("abc", { type: "text" })).toEqual("abc");
    });
    it("should properly cast category", () => {
      expect(castScalarToModelValue("cat", { type: "text" })).toEqual("cat");
    });
    it("should properly cast category", () => {
      expect(castScalarToModelValue(true, { type: "category" })).toEqual("true");
    });
    it("should properly cast keywords", () => {
      expect(castScalarToModelValue("tag1", { type: "keywords", separator: "," })).toEqual(["tag1"]);
    });
    it("should properly cast keywords", () => {
      expect(castScalarToModelValue("tag1,tag2,tag1", { type: "keywords", separator: "," })).toEqual([
        "tag1",
        "tag2",
        "tag1",
      ]);
    });
    it("should properly cast date", () => {
      expect(castScalarToModelValue("2025/05/06", { type: "date", format: "yyyy/MM/dd" })).toEqual(
        DateTime.fromISO("2025-05-06"),
      );
    });
    it("should properly cast date", () => {
      expect(castScalarToModelValue("2025-06", { type: "date", format: "yyyy-MM" })).toEqual(
        DateTime.fromISO("2025-06"),
      );
    });
    it("should properly cast error date", () => {
      expect(castScalarToModelValue("not a date", { type: "date", format: "yyyy-MM" })).toEqual(undefined);
    });
  });

  describe("#serializeModelValueToScalar", () => {
    it("should properly serialize integer", () => {
      expect(serializeModelValueToScalar(12, { type: "number" }, undefined)).toEqual(12);
      expect(serializeModelValueToScalar(1.3, { type: "number" }, undefined)).toEqual(1.3);
    });
    it("should properly serialize category/text", () => {
      expect(serializeModelValueToScalar("tag", { type: "category" }, undefined)).toEqual("tag");
      expect(serializeModelValueToScalar("tag", { type: "text" }, undefined)).toEqual("tag");
    });
    it("should properly serialize keywords", () => {
      expect(
        serializeModelValueToScalar(["tag1", "tag2", "tag1"], { type: "keywords", separator: ";" }, undefined),
      ).toEqual("tag1;tag2;tag1");
    });
    it("should properly serialize date", () => {
      expect(
        serializeModelValueToScalar(
          DateTime.fromISO("2025-12-08") as DateTime<true>,
          {
            type: "date",
            format: "yyyy/dd/MM",
          },
          undefined,
        ),
      ).toEqual("2025/08/12");
    });
    it("should properly throw when scalar can not be generated", () => {
      expect(serializeModelValueToScalar(undefined, { type: "number" }, "I am not a number")).toEqual(undefined);
      expect(serializeModelValueToScalar(undefined, { type: "date", format: "yyyy" }, "I am not a date")).toEqual(
        undefined,
      );
    });
  });
});
