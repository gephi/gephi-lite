import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { DATE_FORMATS } from "./date";

describe("DateTime formats", () => {
  DATE_FORMATS.forEach(({ format, example, description }) => {
    it(`should properly parse dates like "${example}" with format "${format}" (${description})`, () => {
      expect(DateTime.fromFormat(example, format).isValid).toBe(true);
    });
  });
});
