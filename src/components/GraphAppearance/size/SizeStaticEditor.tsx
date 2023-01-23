import { keys } from "lodash";
import { FC, useState } from "react";
import { ItemType } from "../../../core/types";
import { AttributeSelect } from "../../forms/AttributeSelect";
import { isNumber } from "./utils";

// TODO: MOVE TO CONTEXT
type AttributeValueIndex = Record<string, Record<string, number>>;
const nodeAttributesIndex: AttributeValueIndex = {
  att_dual: { "1": 12, "20": 6, "30": 3 },
  att_quali: { truc: 8, machin: 9, bidule: 4 },
  att_color: { "#FFFFFF": 1, "#124567": 5, "#AA12FF": 15 },
  att_partial_fail_color: { "#zerze": 2, "#323": 5 },
};
const edgeAttributesIndex: AttributeValueIndex = {
  weight: { "1.2": 1, "1.5": 1, "0.2": 5 },
  type: { knows: 12, hates: 10 },
};

export const SizeStaticEditor: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const attributeValues = itemType === "nodes" ? nodeAttributesIndex : edgeAttributesIndex;
  const [staticSizeAttId, setStaticSizeAttId] = useState<string | undefined>(keys(nodeAttributesIndex)[0]);

  const sizes = !!staticSizeAttId && keys(attributeValues[staticSizeAttId]);
  const validSizes = sizes && sizes.filter((c) => isNumber(c));
  const inValidSizes = sizes && sizes.filter((c) => !isNumber(c));

  return (
    <div>
      <AttributeSelect
        attributeId={staticSizeAttId}
        itemType={itemType}
        attributesFilter={(a) => !!a.qualitative}
        onChange={(aid) => setStaticSizeAttId(aid)}
      />
      {staticSizeAttId && sizes && (
        <div>
          <div>
            {sizes
              .filter((c) => isNumber(c))
              .map((c) => (
                <div className="d-flex flex-no-wrap align-items-center">
                  <div>{c}</div>
                  <div
                    style={{
                      margin: "2px",
                      borderRadius: "100%",
                      backgroundColor: "lightgrey",
                      width: `${c}px`,
                      minWidth: "5px",
                      minHeight: "5px",
                      height: `${c}px`,
                    }}
                  />
                </div>
              ))}
          </div>
          {
            //TODO: make a warning component
          }
          {inValidSizes && inValidSizes.length > 0 && (
            <div>
              {validSizes && validSizes.length > 0 ? inValidSizes.length : "all"} invalid sizes: '
              {inValidSizes.slice(0, 3).join("', '")}'...
            </div>
          )}
          {inValidSizes && inValidSizes.length > 0 && validSizes && validSizes.length > 0 && (
            <div>
              {" "}
              <label htmlFor="fallback-size">Fallback size</label>
              <input id="fallback-size" type="number" />
            </div>
          )}
          <button
            type="submit"
            disabled={!validSizes || validSizes.length === 0}
            className="btn btn-primary"
            onClick={() => {
              console.log(`TODO: update context`);
            }}
          >
            validate
          </button>
        </div>
      )}
    </div>
  );
};
