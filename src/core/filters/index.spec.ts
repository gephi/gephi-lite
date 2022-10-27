import { filtersProducers } from "./index";
import { getEmptyFiltersState } from "./utils";

describe("Filters producers", () => {
  describe("#deleteCurrentFilterProducer", () => {
    it("should throw when there is no filter to delete", () => {
      expect(() => {
        filtersProducers.deleteCurrentFilterProducer()(getEmptyFiltersState());
      }).toThrow();
    });
  });
});
