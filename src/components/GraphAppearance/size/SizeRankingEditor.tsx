import { FC, useState } from "react";
import { ItemType } from "../../../core/types";
import { AttributeSelect } from "../../forms/AttributeSelect";

interface SizeScalePointType {
  scalePoint: number;
  size: number;
}

interface SizeRankingSpecification {
  attributeId: string;
  sizeScalePoints: SizeScalePointType[];
  transformationMethod?: "sqrt" | { pow: number } | "log" | { spline: [[number, number], [number, number]] };
}

const SizeScalePoint: FC<SizeScalePointType & { setSize: (size: number) => void }> = ({
  scalePoint,
  size,
  setSize,
}) => {
  //TODO: make a proper colro scale component which allow to add/move intermediary points
  return (
    <div className="d-flex flex-column align-items-center">
      <label htmlFor={`${scalePoint}-size`}>{scalePoint}</label>
      <input id={`${scalePoint}-size`} type="number" value={size} onChange={(e) => setSize(+e.target.value)} />
    </div>
  );
};

export const SizeRankingEditor: FC<{ itemType: ItemType }> = ({ itemType }) => {
  //TODO: get Ranking Editor status from context
  const [sizeRankingSpec, setSizeRankingSpec] = useState<Partial<SizeRankingSpecification | null>>({
    sizeScalePoints: [
      { scalePoint: 0, size: 0 },
      { scalePoint: 0.5, size: 5 },
      { scalePoint: 1, size: 10 },
    ],
  });

  return (
    <div>
      <h4>Ranking</h4>
      <AttributeSelect
        attributeId={sizeRankingSpec?.attributeId}
        onChange={(attId) => setSizeRankingSpec({ ...sizeRankingSpec, attributeId: attId })}
        itemType={itemType}
        attributesFilter={(a) => !!a.quantitative}
      />
      <div className="w-100 d-flex justify-content-between">
        {sizeRankingSpec?.sizeScalePoints?.map((sc, i) => (
          <SizeScalePoint
            key={i}
            {...sc}
            setSize={(size) =>
              setSizeRankingSpec({
                ...sizeRankingSpec,
                sizeScalePoints: [
                  ...(sizeRankingSpec?.sizeScalePoints?.filter((ssc) => ssc.scalePoint !== sc.scalePoint) || []),
                  { scalePoint: sc.scalePoint, size },
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
        disabled={!sizeRankingSpec}
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
