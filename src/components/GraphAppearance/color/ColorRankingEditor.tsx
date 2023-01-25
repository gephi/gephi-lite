import { FC } from "react";
import { useTranslation } from "react-i18next";
import { ItemType } from "../../../core/types";
import { ColorScalePointType, RankingColor } from "../../../core/appearance/types";
import { TransformationMethodsSelect } from "../TransformationMethodSelect";

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
