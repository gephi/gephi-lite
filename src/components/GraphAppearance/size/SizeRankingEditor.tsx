import { FC } from "react";

import { ItemType } from "../../../core/types";
import { RankingSize } from "../../../core/appearance/types";

export const SizeRankingEditor: FC<{
  itemType: ItemType;
  size: RankingSize;
  setSize: (newSize: RankingSize) => void;
}> = ({ size, setSize }) => {
  return (
    <div>
      <h4>Ranking</h4>
      <div className="w-100 d-flex justify-content-between">
        <div className="d-flex flex-column align-items-center">
          <label htmlFor="min-size">Min</label>
          <input
            id="min-size"
            type="number"
            value={size.minSize}
            onChange={(e) => setSize({ ...size, minSize: +e.target.value })}
          />
        </div>
        <div className="d-flex flex-column align-items-center">
          <label htmlFor="max-size">Max</label>
          <input
            id="max-size"
            type="number"
            value={size.maxSize}
            onChange={(e) => setSize({ ...size, maxSize: +e.target.value })}
          />
        </div>
      </div>
      <div>
        TODO:
        <label htmlFor="transformation-method">transformation method</label>
        <select id="transformation-method" className="form-select">
          <option value="">linear</option>
          <option>pow 2</option>
          <option>pow 3</option>
          <option>sqrt</option>
          <option>log</option>
          <option disabled>spline TODO</option>
        </select>
      </div>
    </div>
  );
};
