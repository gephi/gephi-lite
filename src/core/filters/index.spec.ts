import { filtersProducers } from "./index";
import { getEmptyFiltersState } from "./utils";

describe("Filters producers", () => {
  describe("#deleteCurrentFilter", () => {
    it("should throw when there is no filter to delete", () => {
      expect(() => {
        filtersProducers.deleteCurrentFilter()(getEmptyFiltersState());
      }).toThrow();
    });
  });
});
