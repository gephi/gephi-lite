import { FC } from "react";
import { useTranslation } from "react-i18next";

import { FixedSize } from "../../../core/appearance/types";
import { ItemType } from "../../../core/types";

export const SizeFixedEditor: FC<{
  itemType: ItemType;
  size: FixedSize;
  setSize: (newSize: FixedSize) => void;
}> = ({ itemType, size, setSize }) => {
  const { t } = useTranslation();
  const id = `${itemType}-fixedSizeInput`;

  return (
    <div className="d-flex align-items-center">
      <input
        className="form-control form-control-sm w-5"
        type="number"
        value={size.value}
        min={0}
        onChange={(v) => setSize({ ...size, value: +v.target.value })}
        id={id}
      />
      <label className="form-check-label ms-1" htmlFor={id}>
        {t("appearance.size.size_all_items", { items: t(`graph.model.${itemType}`) })}
      </label>
    </div>
  );
};
