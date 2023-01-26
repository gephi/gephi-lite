import Select from "react-select";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ItemType } from "../../../core/types";
import { useAppearance, useAppearanceActions } from "../../../core/context/dataContexts";
import {
  DEFAULT_EDGE_LABEL_SIZE,
  DEFAULT_EDGE_SIZE,
  DEFAULT_NODE_LABEL_SIZE,
  DEFAULT_NODE_SIZE,
} from "../../../core/appearance/utils";

export const LabelSizeItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodesLabelSize, edgesLabelSize } = useAppearance();
  const { setLabelSizeAppearance } = useAppearanceActions();
  const labelSizeDef = itemType === "nodes" ? nodesLabelSize : edgesLabelSize;
  const baseItemSize = itemType === "nodes" ? DEFAULT_NODE_SIZE : DEFAULT_EDGE_SIZE;
  const baseLabelSize = itemType === "nodes" ? DEFAULT_NODE_LABEL_SIZE : DEFAULT_EDGE_LABEL_SIZE;

  const labelSizeOptions = useMemo(
    () => [
      { value: "fixed", label: t("appearance.labels.fixed_size") },
      { value: "item", label: t(`appearance.labels.size`, { items: t(`graph.model.${itemType}`) }) },
    ],
    [itemType, t],
  );
  const selectedOption = useMemo(
    () => labelSizeOptions.find((option) => option.value === labelSizeDef.type),
    [labelSizeOptions, labelSizeDef.type],
  );

  return (
    <>
      <label className="mt-2" htmlFor={`${itemType}-labelSizesMode`}>
        {t("appearance.labels.set_labels_size_from")}
      </label>
      <Select
        id={`${itemType}-labelSizesMode`}
        options={labelSizeOptions}
        value={selectedOption}
        onChange={(option) => {
          if (!option || option.value === "fixed") {
            setLabelSizeAppearance(itemType, {
              type: "fixed",
              value: baseLabelSize,
            });
          } else {
            setLabelSizeAppearance(itemType, {
              type: "item",
              coef: baseLabelSize / baseItemSize,
              adaptsToZoom: false,
            });
          }
        }}
      />

      {labelSizeDef.type === "fixed" && (
        <div className="d-flex align-items-center mt-1">
          <input
            className="form-control form-control-sm w-5"
            type="number"
            value={labelSizeDef.value}
            min={0}
            onChange={(v) => setLabelSizeAppearance(itemType, { ...labelSizeDef, value: +v.target.value })}
            id={`${itemType}-fixedLabelSizeValue`}
          />
          <label className="form-check-label small ms-1" htmlFor={`${itemType}-fixedLabelSizeValue`}>
            {t("appearance.labels.fixed_label_size", { items: t(`graph.model.${itemType}`) })}
          </label>
        </div>
      )}
      {labelSizeDef.type === "item" && (
        <>
          <div className="d-flex align-items-center mt-1">
            <input
              className="form-control form-control-sm w-5"
              type="number"
              value={labelSizeDef.coef}
              min={0}
              onChange={(v) => setLabelSizeAppearance(itemType, { ...labelSizeDef, coef: +v.target.value })}
              id={`${itemType}-fixedLabelSizeValue`}
            />
            <label className="form-check-label small ms-1" htmlFor={`${itemType}-fixedLabelSizeValue`}>
              {t("appearance.labels.size_coef")}
            </label>
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id={`${itemType}-labelsSize-adaptsToZoom`}
              checked={labelSizeDef.adaptsToZoom}
              onChange={(e) =>
                setLabelSizeAppearance(itemType, {
                  ...labelSizeDef,
                  type: "item",
                  adaptsToZoom: e.target.checked,
                })
              }
            />
            <label className="form-check-label" htmlFor={`${itemType}-labelsSize-adaptsToZoom`}>
              {t("appearance.labels.adapts_to_zoom")}
            </label>
          </div>
        </>
      )}
    </>
  );
};
