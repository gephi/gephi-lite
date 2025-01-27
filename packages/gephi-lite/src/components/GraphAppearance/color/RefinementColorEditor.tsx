import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { RefinementColor } from "../../../core/appearance/types";
import { useGraphDataset } from "../../../core/context/dataContexts";
import { ItemType } from "../../../core/types";
import ColorPicker from "../../ColorPicker";
import { DEFAULT_SELECT_PROPS } from "../../consts";

type Option = { value: string; label: string };
function stringToOption(str: string): Option {
  return {
    value: str,
    label: str,
  };
}

export const RefinementColorEditor: FC<{
  itemType: ItemType;
  color: RefinementColor;
  setColor: (newColor: RefinementColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const fieldOptions = useMemo(
    () =>
      (itemType === "nodes" ? nodeFields : edgeFields)
        .filter((field) => field.quantitative)
        .map((field) => ({
          value: field.id,
          label: field.id,
        })),
    [edgeFields, itemType, nodeFields],
  );

  return (
    <>
      <Select<Option>
        {...DEFAULT_SELECT_PROPS}
        options={fieldOptions}
        value={stringToOption(color.field)}
        onChange={(option) => option && setColor({ ...color, field: option.value })}
      />

      <div className="d-flex align-items-center mt-1">
        <ColorPicker color={color.targetColor} onChange={(v) => setColor({ ...color, targetColor: v })} />
        <label className="form-check-label small ms-1">{t("appearance.color.refinement_color")}</label>
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
          id={`${itemType}-refinementColorFactor`}
        />
        <label className="form-check-label small ms-1" htmlFor={`${itemType}-refinementColorFactor`}>
          {t("appearance.color.refinement_factor")}
        </label>
      </div>
      <p className="fst-italic text-muted small m-0">{t(`appearance.color.refinement_factor_description`)}</p>
    </>
  );
};
