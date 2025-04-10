import { ItemDataField } from "@gephi/gephi-lite-sdk";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ShadingColor } from "../../../core/appearance/types";
import { useGraphDataset } from "../../../core/context/dataContexts";
import { staticDynamicAttributeLabel } from "../../../core/graph/dynamicAttributes";
import { ItemType } from "../../../core/types";
import ColorPicker from "../../ColorPicker";
import { Select } from "../../forms/Select";

type Option = { value: ItemDataField; label: string };
function stringToOption(field: ItemDataField): Option {
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
        .filter((field) => field.quantitative)
        .map((field) => ({
          value: { field: field.id, dynamic: field.dynamic },
          label: staticDynamicAttributeLabel({ field: field.id, dynamic: field.dynamic }),
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

      <div className="d-flex align-items-center mt-1">
        <ColorPicker color={color.targetColor} onChange={(v) => setColor({ ...color, targetColor: v })} />
        <label className="form-check-label small ms-1">{t("appearance.color.shading_color")}</label>
      </div>

      <div className="d-flex align-items-center mt-1">
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
      <p className="fst-italic text-muted small m-0">
        {t(`appearance.color.shading_factor_description`, { items: t(`graph.model.${itemType}`) })}
      </p>
    </>
  );
};
