import { filtersProducers, getEmptyFiltersState } from './index';

describe('Filters producers', () => {
  describe('#deleteCurrentFilter', () => {
    it('should throw when there is no filter to delete', () => {
      expect(() => {
        filtersProducers.deleteCurrentFilter()(getEmptyFiltersState());
      }).toThrow();
    });
  });
});
