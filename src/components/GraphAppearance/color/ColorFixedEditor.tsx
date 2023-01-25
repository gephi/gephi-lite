import { FC } from "react";
import { ItemType } from "../../../core/types";
import { FixedColor } from "../../../core/appearance/types";
import { useTranslation } from "react-i18next";

export const ColorFixedEditor: FC<{
  itemType: ItemType;
  color: FixedColor;
  setColor: (newColor: FixedColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();
  const id = `${itemType}-fixedColorInput`;

  return (
    <div className="form-check mt-1">
      <input
        className="form-check-input"
        type="color"
        value={color.value}
        onChange={(v) => setColor({ ...color, value: v.target.value })}
        id={id}
      />
      <label className="form-check-label small ms-1" htmlFor={id}>
        {t("appearance.color.color_all_items", { items: t(`graph.model.${itemType}`) })}
      </label>
    </div>
  );
};
