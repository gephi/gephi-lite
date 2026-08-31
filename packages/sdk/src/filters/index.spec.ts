import { describe, expect, it } from "vitest";

import { FiltersState, parseFiltersState, serializeFiltersState } from ".";

describe("filters lifecycle", () => {
  it("round-trips an edge date range filter", () => {
    const filters: FiltersState = {
      filters: [
        {
          type: "range",
          itemType: "edges",
          field: {
            id: "createdAt",
            itemType: "edges",
            type: "date",
            format: "yyyy-MM-dd",
          },
          min: 1_735_689_600_000,
          max: 1_738_281_600_000,
          keepMissingValues: false,
        },
      ],
    };

    expect(parseFiltersState(serializeFiltersState(filters))).toEqual(filters);
  });
});
