import { describe, expect, it } from "vitest";

import { codeToFunction, stripFunctionJsDoc } from "./functions";

describe("codeToFunction", () => {
  it("converts a function declaration string to a callable function", () => {
    const double = codeToFunction<(value: number) => number>(`function double(value) {
  return value * 2;
}`);

    expect(double(3)).toBe(6);
  });

  it("accepts a JSDoc-prefixed function string", () => {
    const jsDoc = `/**
 * @param {number} value
 */`;

    const increment = codeToFunction<(value: number) => number>(`${jsDoc}
function increment(value) {
  return value + 1;
}`);

    expect(increment(3)).toBe(4);
  });

  it("rejects code that does not evaluate to a function", () => {
    expect(() => codeToFunction("1 + 1")).toThrow("Code must define a function");
  });
});

describe("stripFunctionJsDoc", () => {
  const jsDoc = `/**
 * Example function.
 */`;
  const code = `function example() {
  return true;
}`;

  it("removes the readonly JSDoc header from editor contents", () => {
    expect(stripFunctionJsDoc(`${jsDoc}\n${code}`, jsDoc)).toBe(code);
  });

  it("keeps the editor contents when the expected header is not present", () => {
    expect(stripFunctionJsDoc(code, jsDoc)).toBe(code);
  });
});
