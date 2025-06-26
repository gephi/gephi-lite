import { shuffle } from "lodash";
import { describe, expect, it } from "vitest";

import { guessSeparator, inferFieldType } from "./fieldModel";

describe("Graph utilities", () => {
  describe("#inferFieldType", () => {
    it("should properly handle a list of differing numbers", () => {
      expect(inferFieldType([123, -123, 456, 789, Infinity], 5)).toEqual({
        type: "number",
      });
    });

    it("should properly handle a list of differing strings", () => {
      expect(inferFieldType(["Alexis", "Benoit", "Paul", "Guillaume", "Mathieu"], 5)).toEqual({
        type: "text",
      });
    });

    it("should properly handle a list of repeating strings", () => {
      expect(inferFieldType(["Nantes", "Nantes", "Nantes", "Paris", "Paris"], 5)).toEqual({
        type: "category",
      });
    });

    it("should properly handle a list of repeating numbers", () => {
      expect(inferFieldType([44, 44, 44, 75, 75], 5)).toEqual({
        type: "number",
      });
    });

    // categories as numbers
    it("should properly handle a list of repeating numbers from 1 in series", () => {
      const numbersFromSeriesRepeating = shuffle([1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 6, 6, 7]);
      expect(inferFieldType(numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "category",
      });
    });
    it("should properly handle a list of repeating numbers from 0 in series", () => {
      const numbersFromSeriesRepeating = shuffle([0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 6, 6, 7]);
      expect(inferFieldType(numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "category",
      });
    });
    it("should properly handle a list of repeating numbers in almost series", () => {
      const numbersFromSeriesRepeating = shuffle([0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 6, 6, 7, 10]);
      expect(inferFieldType(numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "number",
      });
    });
    it("should properly handle a list of repeating numbers in almost series", () => {
      const numbersFromSeriesRepeating = shuffle([2, 2, 3, 4, 5, 5, 5, 6, 6, 7, 10]);
      expect(inferFieldType(numbersFromSeriesRepeating, numbersFromSeriesRepeating.length)).toEqual({
        type: "number",
      });
    });

    it("should properly detect separators", () => {
      expect(
        inferFieldType(["TypeScript", "Neo4J,TypeScript", "Python,TypeScript", "TypeScript,Python", "TypeScript"], 5),
      ).toEqual({
        type: "keywords",
        separator: ",",
      });
    });

    it("should properly detect date", () => {
      expect(inferFieldType(["2025-06", "2023", "2012-06-03", "2025-06-24T15:30:21.907Z"], 5)).toEqual({
        type: "date",
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
});
