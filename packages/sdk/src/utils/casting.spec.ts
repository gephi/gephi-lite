import { describe, expect, it } from "vitest";

import { Scalar } from "../graph";
import { toNumber, toScalar, toString } from "./casting";

describe("Casting utilities", () => {
  describe("#toNumber", () => {
    it("should work with numbers", () => {
      const tests: [number, ReturnType<typeof toNumber>][] = [
        [123, 123],
        [-123, -123],
        [Infinity, Infinity],
        [-Infinity, -Infinity],
        [NaN, undefined],
      ];

      tests.forEach(([input, expected]) => expect(toNumber(input)).toBe(expected));
    });

    it("should work with strings", () => {
      const tests: [string, ReturnType<typeof toNumber>][] = [
        ["123", 123],
        ["-123", -123],
        ["0.000123", 0.000123],
        ["-0.000123", -0.000123],
        ["1e7", 1e7],
        ["Infinity", Infinity],
        ["-Infinity", -Infinity],
        ["NaN", undefined],
      ];

      tests.forEach(([input, expected]) => expect(toNumber(input)).toBe(expected));
    });

    it("should return `undefined` for anything else", () => {
      const values = [{ abc: 123 }, ["toto"], new Date(), undefined, null, true, false];
      values.forEach((input) => expect(toNumber(input)).toBe(undefined));
    });
  });

  describe("#toString", () => {
    it("should work with strings", () => {
      const values: string[] = ["123", "-123", "0.000123", "-0.000123", "1e7", "Infinity", "-Infinity", "NaN"];
      values.forEach((input) => expect(toString(input)).toBe(input));
    });

    it("should work with numbers", () => {
      const values: number[] = [123, -123, 0.000123, -0.000123, 1e7, Infinity, -Infinity, NaN];
      values.forEach((input) => expect(toString(input)).toBe(input + ""));
    });

    it("should work with boolean", () => {
      const values: boolean[] = [true, false];
      values.forEach((input) => expect(toString(input)).toBe(input.toString()));
    });

    it("should work with other types", () => {
      const tests = [
        [new Date(), undefined],
        [{ abc: 123 }, undefined],
        [[123], undefined],
        [null, undefined],
        [undefined, undefined],
      ];

      tests.forEach(([input, expected]) => expect(toString(input as Scalar)).toBe(expected));
    });
  });

  describe("#toScalar", () => {
    it("should work with scalars as inputs", () => {
      const values: Scalar[] = [123, NaN, "abc", false, true, undefined];
      values.forEach((input) => expect(toScalar(input)).toBe(input));
    });

    it("should work with objects", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tests: [any, ReturnType<typeof toScalar>][] = [
        [new Date(), new Date().toString()],
        [{ abc: 123 }, '{"abc":123}'],
        [[123, "some text, with a coma"], '[123,"some text, with a coma"]'],
        [null, undefined],
      ];

      tests.forEach(([input, expected]) => expect(toScalar(input)).toBe(expected));
    });
  });
});
