import { FC } from "react";
import { ItemType } from "../../../core/types";
import { FixedColor } from "../../../core/appearance/types";
import { useTranslation } from "react-i18next";
import ColorPicker from "../../ColorPicker";

export const ColorFixedEditor: FC<{
  itemType: ItemType;
  color: FixedColor;
  setColor: (newColor: FixedColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center mt-1">
      <ColorPicker color={color.value} onChange={(v) => setColor({ ...color, value: v })} />
      <label className="form-check-label small ms-1">
        {t("appearance.color.color_all_items", { items: t(`graph.model.${itemType}`) })}
      </label>
    </div>
  );
};
