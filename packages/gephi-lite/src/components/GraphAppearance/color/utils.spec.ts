import { describe, expect, it } from "vitest";

import { colorSpacePresetsSortedByArea, detectSmallestCompatibleColorSpace } from "./utils";

describe("Color Utils", () => {
  it("should properly sort preset by size", () => {
    expect(colorSpacePresetsSortedByArea).toEqual([
      "ochre-sand",
      "indigo-night",
      "blue-ocean",
      "purple-wine",
      "yellow-lime",
      "tarnish",
      "fancy-light",
      "red-roses",
      "pastel",
      "sensible",
      "ice-cube",
      "green-mint",
      "shades",
      "fancy-dark",
      "fluo",
      "colorblind",
      "default",
      "pimp",
      "intense",
      "all",
    ]);
  });
  it("should properly detect red roses", () => {
    const space = detectSmallestCompatibleColorSpace(["#d746ae", "#c2809b", "#cb4572"]);
    expect(space).toEqual("red-roses");
  });
  it("should properly detect colorblind", () => {
    const space = detectSmallestCompatibleColorSpace(["#a09344", "#7f64b9", "#c36785"]);
    expect(space).toEqual("colorblind");
  });
  it("should properly detect green-mint", () => {
    const space = detectSmallestCompatibleColorSpace(["#c2ce88", "#97d54c", "#68823f"]);
    expect(space).toEqual("green-mint");
  });
  it("should properly detect fancy-light", () => {
    const space = detectSmallestCompatibleColorSpace(["#e6b8c4", "#98d4e4", "#e1c4aa", "#bfbee0", "#b7d7bd"]);
    expect(space).toEqual("fancy-light");
  });
});
