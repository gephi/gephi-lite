import { map } from "lodash";
import { FC, useState } from "react";
import AnimateHeight from "react-animate-height";
import { useTranslation } from "react-i18next";

import { PartitionColor } from "../../../core/appearance/types";
import { ItemType } from "../../../core/types";
import ColorPicker from "../../ColorPicker";

export const ColorPartitionEditor: FC<{
  itemType: ItemType;
  color: PartitionColor;
  setColor: (newColor: PartitionColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      <AnimateHeight height={expanded ? "auto" : 200} className="position-relative" duration={400}>
        {map(color.colorPalette, (c, value) => (
          <div key={value} className="d-inline-block w-50 d-inline-flex align-items-center flex-nowrap" title={value}>
            <ColorPicker
              color={c}
              onChange={(v) =>
                setColor({
                  ...color,
                  colorPalette: {
                    ...color.colorPalette,
                    [value]: v,
                  },
                })
              }
            />
            <label className="form-check-label small ms-1 flex-grow-1 flex-shrink-1 text-ellipsis">{value}</label>
          </div>
        ))}

        <div className="d-flex align-items-center mt-1">
          <ColorPicker color={color.missingColor} onChange={(v) => setColor({ ...color, missingColor: v })} />
          <label className="form-check-label small ms-1">
            {t("appearance.color.default_value", { items: t(`graph.model.${itemType}`) })}
          </label>
        </div>

        <div className="pb-5" />

        {!expanded && <div className="filler-fade-out position-absolute bottom-0" />}
        <div className="w-100 bottom-0 position-absolute text-center">
          <button className="btn btn-sm btn-dark" onClick={() => setExpanded(!expanded)}>
            {expanded ? t("common.show_less") : t("common.show_more")}
          </button>
        </div>
      </AnimateHeight>
    </div>
  );
};
