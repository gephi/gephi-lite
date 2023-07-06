import { guessSeparator, inferFieldType } from "./utils";

describe("Graph utilities", () => {
  describe("#inferFieldType", () => {
    it("should properly handle a list of differing numbers", () => {
      expect(inferFieldType([123, -123, 456, 789, Infinity], 5)).toEqual({
        quantitative: { unit: null },
        qualitative: null,
      });
    });

    it("should properly handle a list of differing strings", () => {
      expect(inferFieldType(["Alexis", "Benoit", "Paul", "Guillaume", "Mathieu"], 5)).toEqual({
        quantitative: null,
        qualitative: null,
      });
    });

    it("should properly handle a list of repeating strings", () => {
      expect(inferFieldType(["Nantes", "Nantes", "Nantes", "Paris", "Paris"], 5)).toEqual({
        quantitative: null,
        qualitative: { separator: null },
      });
    });

    it("should properly handle a list of repeating numbers", () => {
      expect(inferFieldType([44, 44, 44, 75, 75], 5)).toEqual({
        quantitative: { unit: null },
        qualitative: { separator: null },
      });
    });

    it("should properly detect separators", () => {
      expect(
        inferFieldType(
          [
            "TypeScript",
            "Neo4J,TypeScript",
            "Python,TypeScript",
            "TypeScript,Python",
            "TypeScript",
          ],
          5,
        ),
      ).toEqual({
        quantitative: null,
        qualitative: { separator: "," },
      });
    });
  });

  describe("#guessSeparator", () => {
    it("should propertly detect classic detectors", () => {
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
