import { keys } from "lodash";
import { FC, useState } from "react";
import { AttributeSelect } from "../forms/AttributeSelect";
import { NodeEdgeProps } from "../forms/NodeEdgeTabs";

// TODO: MOVE TO CONTEXT
type AttributeValueIndex = Record<string, Record<string, number>>;
const nodeAttributesIndex: AttributeValueIndex = {
  att_dual: { "1": 12, "2": 6, "3": 3 },
  att_quali: { truc: 8, machin: 9, bidule: 4 },
  att_color: { "#FFFFFF": 1, "#124567": 5, "#AA12FF": 15 },
  att_partial_fail_color: { "#zerze": 2, "#323": 5 },
};
const edgeAttributesIndex: AttributeValueIndex = {
  weight: { "1.2": 1, "1.5": 1, "0.2": 5 },
  type: { knows: 12, hates: 10 },
};

const isValidColor = (color: string) => {
  const hexColorRE = /^#[1-9A-Fa-f]{3}|[1-9A-Fa-f]{6}|[1-9A-Fa-f]{8}$/;
  return hexColorRE.test(color);
};

export const ColorStaticEditor: FC<NodeEdgeProps> = ({ nodeEdge }) => {
  const [staticColorAttId, setStaticColorAttId] = useState<string | undefined>();
  const attributeValues = nodeEdge === "node" ? nodeAttributesIndex : edgeAttributesIndex;
  const colors = !!staticColorAttId && keys(attributeValues[staticColorAttId]);

  const validColors = colors && colors.filter((c) => isValidColor(c));
  const inValidColors = colors && colors.filter((c) => !isValidColor(c));

  return (
    <div>
      <AttributeSelect
        attributeId={staticColorAttId}
        nodeEdge={nodeEdge}
        attributesFilter={(a) => !!a.qualitative}
        onChange={(aid) => setStaticColorAttId(aid)}
      />
      {staticColorAttId && colors && (
        <div>
          <div className="d-flex">
            {colors
              .filter((c) => isValidColor(c))
              .map((c) => (
                <div
                  style={{ margin: "2px", border: "solid grey 1px", backgroundColor: c, width: "20px", height: "20px" }}
                />
              ))}
          </div>
          {
            //TODO: make a warning component
          }
          {inValidColors && inValidColors.length > 0 && (
            <div>
              {validColors && validColors.length > 0 ? inValidColors.length : "all"} colors are invalid: '
              {inValidColors.slice(0, 3).join("', '")}'...
            </div>
          )}
          {inValidColors && inValidColors.length > 0 && validColors && validColors.length > 0 && (
            <div>
              {" "}
              <label htmlFor="fallback-color">Fallback color</label>
              <input id="fallback-color" type="color" />
            </div>
          )}
          <button
            disabled={!validColors || validColors.length === 0}
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
