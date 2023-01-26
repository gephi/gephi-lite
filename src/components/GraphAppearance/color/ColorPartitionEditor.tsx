import { every, flatMap, map, uniq } from "lodash";
import { FC, useEffect, useState } from "react";
import iwanthue from "iwanthue";
import { isColor } from "./utils";
import { ItemType } from "../../../core/types";
import { PartitionColor } from "../../../core/appearance/types";
import { graphDatasetAtom } from "../../../core/graph";
import { useTranslation } from "react-i18next";
import AnimateHeight from "react-animate-height";

export const ColorPartitionEditor: FC<{
  itemType: ItemType;
  color: PartitionColor;
  setColor: (newColor: PartitionColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // init palette
  useEffect(() => {
    const values = uniq(
      flatMap(graphDatasetAtom.get().nodeData, (nodeData) => {
        const v = nodeData[color.field];
        if (typeof v === "number" || (typeof v === "string" && !!v)) return [v + ""];
        return [];
      }),
    ) as string[];

    if (every(values, (v) => isColor(v))) {
      setColor({
        ...color,
        colorPalette: values.reduce((iter, v) => ({ ...iter, [v]: v }), {}),
      });
    } else {
      const palette = iwanthue(values.length);
      setColor({
        ...color,
        colorPalette: values.reduce((iter, v, i) => ({ ...iter, [v]: palette[i] }), {}),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color.field]);

  return (
    <div className="mt-1">
      <AnimateHeight height={expanded ? "auto" : 200} className="position-relative" duration={400}>
        {map(color.colorPalette, (c, value) => {
          const id = `${itemType}-color-${value}`;
          return (
            <div key={value} className="d-inline-block w-50 d-inline-flex align-items-center flex-nowrap" title={value}>
              <input
                className="form-control form-control-sm form-control-color d-inline-block flex-grow-0 flex-shrink-0"
                type="color"
                value={c}
                id={id}
                onChange={(e) =>
                  setColor({
                    ...color,
                    colorPalette: {
                      ...color.colorPalette,
                      [value]: e.target.value,
                    },
                  })
                }
              />
              <label className="form-check-label small ms-1 flex-grow-1 flex-shrink-1 text-ellipsis" htmlFor={id}>
                {value}
              </label>
            </div>
          );
        })}

        <div className="d-flex align-items-center mt-1">
          <input
            className="form-control form-control-sm form-control-color d-inline-block flex-grow-0 flex-shrink-0"
            type="color"
            value={color.missingColor}
            onChange={(v) => setColor({ ...color, missingColor: v.target.value })}
            id={`${itemType}-defaultColor`}
          />
          <label className="form-check-label small ms-1" htmlFor={`${itemType}-defaultColor`}>
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
