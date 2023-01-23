import { FC, useState } from "react";
import { AttributeSelect } from "../../forms/AttributeSelect";
import { NodeEdgeProps } from "../../forms/NodeEdgeTabs";

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

export const ColorRankingEditor: FC<NodeEdgeProps> = ({ nodeEdge }) => {
  //TODO: get Ranking Editor status from context
  const [colorRankingSpec, setColorRankingSpec] = useState<Partial<ColorRankingSpecification | null>>({
    colorScalePoints: [
      { scalePoint: 0, color: "#FFFFFF" },
      { scalePoint: 1, color: "#11EE33" },
    ],
  });

  return (
    <div>
      <h4>Ranking</h4>
      <AttributeSelect
        attributeId={colorRankingSpec?.attributeId}
        onChange={(attId) => setColorRankingSpec({ ...colorRankingSpec, attributeId: attId })}
        nodeEdge={nodeEdge}
        attributesFilter={(a) => !!a.quantitative}
      />
      <div className="w-100 d-flex justify-content-between">
        {colorRankingSpec?.colorScalePoints?.map((sc, i) => (
          <ColorScalePoint
            key={i}
            {...sc}
            setColor={(color) =>
              setColorRankingSpec({
                ...colorRankingSpec,
                colorScalePoints: [
                  ...(colorRankingSpec?.colorScalePoints?.filter((ssc) => ssc.scalePoint !== sc.scalePoint) || []),
                  { scalePoint: sc.scalePoint, color },
                ],
              })
            }
          />
        ))}
      </div>
      <div>
        TODO:
        <label htmlFor="transformation-method">transformation method</label>
        <select id="transformation-method" className="form-select">
          <option value="">linear</option>
          <option>pow 2</option>
          <option>pow 3</option>
          <option>sqrt</option>
          <option>log</option>
          <option disabled>spline TODO</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={!colorRankingSpec}
        className="btn btn-primary"
        onClick={(event) => {
          // TODO: Fix event handler code
          console.log(`TODO: update context`);
        }}
      >
        validate
      </button>
    </div>
  );
};
