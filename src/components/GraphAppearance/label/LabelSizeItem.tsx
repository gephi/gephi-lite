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
      <label htmlFor="sizeMethod">{t("appearance.labels.size_labels_from")}</label>
      <Select
        options={labelSizeOptions}
        value={selectedOption}
        onChange={(option) => {
          if (!option || option.value === "fixed") {
            setLabelSizeAppearance(itemType, {
              type: "fixed",
              value: baseItemSize,
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
        <input
          type="number"
          value={labelSizeDef.value}
          onChange={(e) =>
            setLabelSizeAppearance(itemType, {
              ...labelSizeDef,
              type: "fixed",
              value: +e.target.value,
            })
          }
        />
      )}
      {labelSizeDef.type === "item" && (
        <>
          <div>
            <input
              type="number"
              value={labelSizeDef.coef}
              onChange={(e) =>
                setLabelSizeAppearance(itemType, {
                  ...labelSizeDef,
                  type: "item",
                  coef: +e.target.value,
                })
              }
            />
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
              Adapts sizes to zoom
            </label>
          </div>
        </>
      )}
    </>
  );
};
