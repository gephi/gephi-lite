import { FieldModel, ShadingColor } from "@gephi/gephi-lite-sdk";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useGraphDataset } from "../../../core/context/dataContexts";
import { staticDynamicAttributeLabel } from "../../../core/graph/dynamicAttributes";
import { ItemType } from "../../../core/types";
import ColorPicker from "../../ColorPicker";
import { Select } from "../../forms/Select";

type Option = { value: FieldModel<ItemType, boolean>; label: string };
function stringToOption(field: FieldModel<ItemType, boolean>): Option {
  return {
    value: field,
    label: staticDynamicAttributeLabel(field),
  };
}

export const ShadingColorEditor: FC<{
  itemType: ItemType;
  color: ShadingColor;
  setColor: (newColor: ShadingColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const fieldOptions = useMemo(
    () =>
      (itemType === "nodes" ? nodeFields : edgeFields)
        // TODO : should we allow date here ?
        .filter((field) => field.type === "number")
        .map((field) => ({
          value: field,
          label: staticDynamicAttributeLabel(field),
        })),
    [edgeFields, itemType, nodeFields],
  );

  return (
    <>
      <label className="small text-muted" htmlFor={`${itemType}-shadingColorAttribute`}>
        {t("appearance.color.shading_attribute", { items: t(`graph.model.${itemType}`) })}
      </label>
      <Select<Option>
        id={`${itemType}-shadingColorAttribute`}
        options={fieldOptions}
        value={stringToOption(color.field)}
        onChange={(option) => option && setColor({ ...color, field: option.value })}
      />

      <div className="d-flex align-items-baseline mt-1">
        <ColorPicker color={color.targetColor} onChange={(v) => setColor({ ...color, targetColor: v })} />
        <label className="form-check-label small ms-1">{t("appearance.color.shading_color")}</label>
      </div>

      <div className="d-flex align-items-baseline mt-1">
        <input
          className="form-control form-control-sm w-5"
          type="number"
          value={color.factor}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setColor({ ...color, factor: +v.target.value })}
          id={`${itemType}-shadingColorFactor`}
        />
        <label className="form-check-label small ms-1" htmlFor={`${itemType}-shadingColorFactor`}>
          {t("appearance.color.shading_factor")}
        </label>
      </div>
      <p className="form-text small text-muted">
        {t(`appearance.color.shading_factor_description`, { items: t(`graph.model.${itemType}`) })}
      </p>
    </>
  );
};
