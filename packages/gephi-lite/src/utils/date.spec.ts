import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { DATE_FORMATS, getDateInputSpec } from "./date";

describe("DateTime formats", () => {
  DATE_FORMATS.forEach(({ format, example, description }) => {
    it(`should properly parse dates like "${example}" with format "${format}" (${description})`, () => {
      expect(DateTime.fromFormat(example, format).isValid).toBe(true);
    });
  });
});

describe("#getDateInputSpec", () => {
  it("uses a date input for date-only formats", () => {
    expect(getDateInputSpec("yyyy-MM-dd")).toEqual({ inputType: "date", inputFormat: "yyyy-MM-dd" });
  });

  it("uses a datetime input for 12-hour and 24-hour time formats", () => {
    expect(getDateInputSpec("yyyy-MM-dd HH:mm:ss")).toEqual({
      inputType: "datetime-local",
      inputFormat: "yyyy-MM-dd'T'HH:mm",
    });
    expect(getDateInputSpec("MM/dd/yyyy, h:mm:ss a").inputType).toBe("datetime-local");
  });
});
