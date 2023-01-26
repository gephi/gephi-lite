import { FC } from "react";
import chroma from "chroma-js";
import { useTranslation } from "react-i18next";
import { ItemType } from "../../../core/types";
import { RankingColor } from "../../../core/appearance/types";

export const ColorRankingEditor: FC<{
  itemType: ItemType;
  color: RankingColor;
  setColor: (newColor: RankingColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();
  return (
    <>
      <div>
        {color.colorScalePoints.map((sc, index) => {
          return (
            <div key={index} className="d-flex align-items-center mt-1">
              <input
                className="form-control form-control-sm form-control-color d-inline-block"
                type="color"
                value={sc.color}
                onChange={(e) =>
                  setColor({
                    ...color,
                    colorScalePoints:
                      color.colorScalePoints.map((ssc, i) =>
                        i === index ? { scalePoint: sc.scalePoint, color: e.target.value } : ssc,
                      ) || [],
                  })
                }
              />
              <button
                className="btn btn-outline-dark btn-sm ms-2"
                onClick={() =>
                  setColor({
                    ...color,
                    colorScalePoints: color.colorScalePoints.filter((ssc, i) => i !== index) || [],
                  })
                }
              >
                - {t("common.delete")}
              </button>
            </div>
          );
        })}
        <button
          className="btn btn-outline-dark btn-sm mt-2"
          onClick={() =>
            setColor({
              ...color,
              colorScalePoints: color.colorScalePoints.concat({
                color: chroma.random().hex(),
                scalePoint: 1,
              }),
            })
          }
        >
          + {t("common.add")}
        </button>

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
      </div>
      {/*<div>*/}
      {/*  TODO:*/}
      {/*  <TransformationMethodsSelect />*/}
      {/*</div>*/}
    </>
  );
};
