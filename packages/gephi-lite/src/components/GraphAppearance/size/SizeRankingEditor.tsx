import { DEFAULT_EDGE_SIZE, DEFAULT_NODE_SIZE, RankingSize } from "@gephi/gephi-lite-sdk";
import { omit, pick } from "lodash";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";

import { ItemType } from "../../../core/types";
import { TransformationMethodsSelect } from "../TransformationMethodSelect";

type Extrema = { minSize: number; maxSize: number };

export const SizeRankingEditor: FC<{
  itemType: ItemType;
  size: RankingSize;
  setSize: (newSize: RankingSize) => void;
}> = ({ itemType, size, setSize }) => {
  const { t } = useTranslation();
  const toggleExtremaId = `${itemType}-rankingSizeInput-toggleExtrema`;
  const minId = `${itemType}-rankingSizeInput-min`;
  const maxId = `${itemType}-rankingSizeInput-max`;
  const defaultId = `${itemType}-rankingSizeInput-default`;
  const hasExtrema = "minSize" in size;

  const [cachedSizes, setCachedSizes] = useState<Extrema>(() => {
    if (hasExtrema) return { minSize: size.minSize, maxSize: size.maxSize } as Extrema;

    const baseValue = itemType === "nodes" ? DEFAULT_NODE_SIZE : DEFAULT_EDGE_SIZE;
    return {
      minSize: baseValue / 2,
      maxSize: baseValue * 2,
    };
  });

  return (
    <>
      <div className="form-check d-flex align-items-center pt-2">
        <input
          className="form-check-input"
          type="checkbox"
          checked={hasExtrema}
          onChange={(e) => {
            if (e.target.checked) {
              setSize({ ...size, ...cachedSizes });
            } else {
              setCachedSizes(pick(size, "minSize", "maxSize") as Extrema);
              setSize(omit(size, "minSize", "maxSize", "transformationMethod"));
            }
          }}
          id={toggleExtremaId}
        />
        <label className="form-check-label" htmlFor={toggleExtremaId}>
          {t("appearance.size.interpolate")}
        </label>
      </div>
      {hasExtrema && (
        <>
          <div className="d-flex align-items-center">
            <input
              className="form-control form-control-sm w-5"
              type="number"
              value={size.minSize}
              min={0}
              max={size.maxSize}
              onChange={(e) => setSize({ ...size, minSize: +e.target.value })}
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
        </>
      )}

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
      {hasExtrema && (
        <div>
          <TransformationMethodsSelect
            method={size.transformationMethod}
            onChange={(method) => setSize({ ...size, transformationMethod: method || undefined } as RankingSize)}
          />
        </div>
      )}
    </>
  );
};
