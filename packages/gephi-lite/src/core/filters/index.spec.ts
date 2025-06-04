import { describe, expect, it } from "vitest";

import { deleteCurrentFilter } from "./index";
import { getEmptyFiltersState } from "./utils";

describe("Filters producers", () => {
  describe("#deleteCurrentFilter", () => {
    it("should throw when there is no filter to delete", () => {
      expect(() => {
        deleteCurrentFilter()(getEmptyFiltersState());
      }).toThrow();
    });
  });
});
