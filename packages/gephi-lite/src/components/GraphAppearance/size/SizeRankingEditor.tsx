import { FC } from "react";
import { useTranslation } from "react-i18next";

import { RankingSize } from "../../../core/appearance/types";
import { ItemType } from "../../../core/types";
import { TransformationMethodsSelect } from "../TransformationMethodSelect";

export const SizeRankingEditor: FC<{
  itemType: ItemType;
  size: RankingSize;
  setSize: (newSize: RankingSize) => void;
}> = ({ itemType, size, setSize }) => {
  const { t } = useTranslation();
  const minId = `${itemType}-rankingSizeInput-min`;
  const maxId = `${itemType}-rankingSizeInput-max`;
  const defaultId = `${itemType}-rankingSizeInput-default`;

  return (
    <>
      <div className="d-flex align-items-center">
        <input
          className="form-control form-control-sm w-5"
          type="number"
          value={size.minSize}
          min={0}
          max={size.maxSize}
          onChange={(v) => setSize({ ...size, minSize: +v.target.value })}
          id={minId}
        />
        <label className="form-check-label ms-1" htmlFor={minId}>
          {t("common.min")}
        </label>
      </div>
      <div className="d-flex align-items-center">
        <input
          className="form-control form-control-sm w-5"
          type="number"
          value={size.maxSize}
          min={size.minSize}
          onChange={(v) => setSize({ ...size, maxSize: +v.target.value })}
          id={maxId}
        />
        <label className="form-check-label ms-1" htmlFor={maxId}>
          {t("common.max")}
        </label>
      </div>
      <div className="d-flex align-items-center pt-2">
        <input
          className="form-control form-control-sm w-5"
          type="number"
          value={size.missingSize}
          min={0}
          onChange={(v) => setSize({ ...size, missingSize: +v.target.value })}
          id={defaultId}
        />
        <label className="form-check-label ms-1" htmlFor={defaultId}>
          {t("appearance.size.default_value", { items: t(`graph.model.${itemType}`) })}
        </label>
      </div>
      <div>
        <TransformationMethodsSelect
          method={size.transformationMethod}
          onChange={(method) => setSize({ ...size, transformationMethod: method || undefined })}
        />
      </div>
    </>
  );
};
