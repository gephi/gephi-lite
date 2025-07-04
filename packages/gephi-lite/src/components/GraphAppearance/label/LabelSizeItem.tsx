import { capitalize } from "lodash";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_EDGE_LABEL_SIZE, DEFAULT_NODE_LABEL_SIZE } from "../../../core/appearance/utils";
import { useAppearance, useAppearanceActions } from "../../../core/context/dataContexts";
import { ItemType } from "../../../core/types";
import { Select } from "../../forms/Select";
import { SliderInput } from "../../forms/TypedInputs";

export const LabelSizeItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodesLabelSize, edgesLabelSize } = useAppearance();
  const { setLabelSizeAppearance } = useAppearanceActions();
  const labelSizeDef = itemType === "nodes" ? nodesLabelSize : edgesLabelSize;
  const baseLabelSize = itemType === "nodes" ? DEFAULT_NODE_LABEL_SIZE : DEFAULT_EDGE_LABEL_SIZE;

  const labelSizeOptions = useMemo(
    () => [
      { value: "fixed", label: t("appearance.labels.fixed_size") },
      { value: "item", label: capitalize(t(`appearance.labels.size`, { items: t(`graph.model.${itemType}`) }) + "") },
    ],
    [itemType, t],
  );
  const selectedOption = useMemo(
    () => labelSizeOptions.find((option) => option.value === labelSizeDef.type),
    [labelSizeOptions, labelSizeDef.type],
  );

  return (
    <div className="panel-block">
      <label htmlFor={`${itemType}-labelSizesMode`}>{t("appearance.labels.set_labels_size_from")}</label>
      <Select
        id={`${itemType}-labelSizesMode`}
        options={labelSizeOptions}
        value={selectedOption}
        onChange={(option) => {
          if (!option || option.value === "fixed") {
            setLabelSizeAppearance(itemType, {
              ...labelSizeDef,
              type: "fixed",
              value: baseLabelSize,
            });
          } else {
            setLabelSizeAppearance(itemType, {
              ...labelSizeDef,
              type: "item",
              sizeCorrelation: baseLabelSize,
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
              value={labelSizeDef.sizeCorrelation}
              min={0}
              onChange={(v) => setLabelSizeAppearance(itemType, { ...labelSizeDef, sizeCorrelation: +v.target.value })}
              id={`${itemType}-fixedLabelSizeValue`}
            />
            <label className="form-check-label small ms-1" htmlFor={`${itemType}-fixedLabelSizeValue`}>
              {t("appearance.labels.size_coef")}
            </label>
          </div>
        </>
      )}
      <SliderInput
        value={labelSizeDef.zoomCorrelation}
        min={0}
        max={1}
        step={0.1}
        onChange={(v) =>
          setLabelSizeAppearance(itemType, {
            ...labelSizeDef,
            zoomCorrelation: v,
          })
        }
        label={t("appearance.labels.adapts_to_zoom")}
      />
      <SliderInput
        value={labelSizeDef.density}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(v) =>
          setLabelSizeAppearance(itemType, {
            ...labelSizeDef,
            density: v,
          })
        }
        marks={{
          0.1: {
            label: "(less labels)",
            style: {
              transform: "translateX(0)",
            },
          },
          10: {
            label: "(more labels)",
            style: {
              whiteSpace: "nowrap",
              transform: "translateX(-100%)",
            },
          },
        }}
        label={t("appearance.labels.density")}
      />
    </div>
  );
};
