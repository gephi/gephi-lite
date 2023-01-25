import { FC } from "react";
import { useTranslation } from "react-i18next";
import { ItemType } from "../../../core/types";
import { ColorScalePointType, RankingColor } from "../../../core/appearance/types";
import { TransformationMethodsSelect } from "../TransformationMethodSelect";
import chroma from "chroma-js";

const ColorScalePoint: FC<ColorScalePointType & { setColor: (color: string) => void }> = ({
  scalePoint,
  color,
  setColor,
}) => {
  //TODO: make a proper colro scale component which allow to add/move intermediary points
  return (
    <div className="d-flex flex-column align-items-center">
      <label htmlFor={`${scalePoint}-color`}>{scalePoint}</label>
      <input id={`${scalePoint}-color`} type="color" value={color} onChange={(e) => setColor(e.target.value)} />
    </div>
  );
};

export const ColorRankingEditor: FC<{
  itemType: ItemType;
  color: RankingColor;
  setColor: (newColor: RankingColor) => void;
}> = ({ color, setColor }) => {
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
                - {t("button.delete")}
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
          + {t("button.add")}
        </button>
      </div>
      {/*<div>*/}
      {/*  TODO:*/}
      {/*  <TransformationMethodsSelect />*/}
      {/*</div>*/}
    </>
  );
};
