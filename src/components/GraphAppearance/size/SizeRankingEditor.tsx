import { FC } from "react";

import { ItemType } from "../../../core/types";
import { RankingSize } from "../../../core/appearance/types";
import { useTranslation } from "react-i18next";
import { TransformationMethodsSelect } from "../TransformationMethodSelect";

export const SizeRankingEditor: FC<{
  itemType: ItemType;
  size: RankingSize;
  setSize: (newSize: RankingSize) => void;
}> = ({ size, setSize }) => {
  const { t } = useTranslation();
  return (
    <div>
      <h4>Ranking</h4>
      <div className="w-100 d-flex justify-content-between">
        <div className="d-flex flex-column align-items-center">
          <label htmlFor="min-size">{t("appearance.size.min")}</label>
          <input
            id="min-size"
            type="number"
            value={size.minSize}
            onChange={(e) => setSize({ ...size, minSize: +e.target.value })}
          />
        </div>
        <div className="d-flex flex-column align-items-center">
          <label htmlFor="max-size">{t("appearance.size.max")}</label>
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
        <TransformationMethodsSelect />
      </div>
    </div>
  );
};
