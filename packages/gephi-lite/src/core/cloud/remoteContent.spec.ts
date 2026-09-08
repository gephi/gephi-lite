import { describe, expect, it } from "vitest";

import { fingerprintContent } from "./remoteContent";

describe("Remote content fingerprint", () => {
  it("should be stable for the same content", () => {
    expect(fingerprintContent('{"a":1}')).toBe(fingerprintContent('{"a":1}'));
  });

  it("should differ for different contents", () => {
    expect(fingerprintContent('{"a":1}')).not.toBe(fingerprintContent('{"a":2}'));
    // Same length, one byte apart: the length prefix alone would not catch it.
    expect(fingerprintContent("abcdef")).not.toBe(fingerprintContent("abcdeg"));
    // Same characters, different order.
    expect(fingerprintContent("ab")).not.toBe(fingerprintContent("ba"));
  });

  it("should handle an empty content", () => {
    expect(fingerprintContent("")).toBe(fingerprintContent(""));
    expect(fingerprintContent("")).not.toBe(fingerprintContent(" "));
  });

  it("should not collide on a realistic pair of graph files", () => {
    const graph = (weight: number) => JSON.stringify({ type: "gephi-lite", edges: [{ id: "e", weight }] });
    expect(fingerprintContent(graph(1))).not.toBe(fingerprintContent(graph(2)));
  });
});
