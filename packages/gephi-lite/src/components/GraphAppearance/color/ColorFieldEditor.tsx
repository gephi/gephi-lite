import { FieldColor } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { ItemType } from "../../../core/types";
import ColorPicker from "../../ColorPicker";

export const ColorFieldEditor: FC<{
  itemType: ItemType;
  color: FieldColor;
  setColor: (newColor: FieldColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-baseline">
      <ColorPicker color={color.missingColor} onChange={(v) => setColor({ ...color, missingColor: v })} />
      <label className="form-check-label small ms-1">
        {t("appearance.color.default_value", { items: t(`graph.model.${itemType}`) })}
      </label>
    </div>
  );
};
