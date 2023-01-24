import { FC, useState } from "react";
import { ItemType } from "../../../core/types";
import { AttributeSelect } from "../../forms/AttributeSelect";
import { RankingColor } from "../../../core/appearance/types";
import { useTranslation } from "react-i18next";
import { TransformationMethodsSelect } from "../TransformationMethodSelect";

interface ColorScalePointType {
  scalePoint: number;
  color: string;
}

interface ColorRankingSpecification {
  attributeId: string;
  colorScalePoints: ColorScalePointType[];
  transformationMethod?: "sqrt" | { pow: number } | "log" | { spline: [[number, number], [number, number]] };
}

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
    <div>
      <h4>{t("appearance.ranking")}</h4>
      <div className="w-100 d-flex justify-content-between">
        {color.colorScalePoints.map((sc, i) => (
          <ColorScalePoint
            key={i}
            {...sc}
            setColor={(value) =>
              setColor({
                ...color,
                colorScalePoints: [
                  ...(color.colorScalePoints.filter((ssc) => ssc.scalePoint !== sc.scalePoint) || []),
                  { scalePoint: sc.scalePoint, color: value },
                ],
              })
            }
          />
        ))}
      </div>
      <div>
        TODO:
        <TransformationMethodsSelect />
      </div>
    </div>
  );
};
