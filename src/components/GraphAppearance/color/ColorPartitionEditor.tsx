import { every, fromPairs, keys, toPairs } from "lodash";
import { FC, useEffect, useState } from "react";
import { AttributeSelect } from "../../forms/AttributeSelect";
import iwanthue from "iwanthue";
import { isColor } from "./utils";
import { ItemType } from "../../../core/types";

interface ColorPartitionSpec {
  attributeId: string;
  colorPalette: Record<string, string>;
  missingColor: string;
}

// TODO: MOVE TO CONTEXT
type AttributeValueIndex = Record<string, Record<string, number>>;
const nodeAttributesIndex: AttributeValueIndex = {
  att_dual: { "1": 12, "2": 6, "3": 3 },
  att_quali: { truc: 8, machin: 9, bidule: 4 },
  att_color: { "#FFFFFF": 1, "#124567": 5, "#AA12FF99": 15 },
  att_partial_fail_color: { "#zerze": 2, "#323": 5 },
};
const edgeAttributesIndex: AttributeValueIndex = {
  weight: { "1.2": 1, "1.5": 1, "0.2": 5 },
  type: { knows: 12, hates: 10 },
};

export const ColorPartitionEditor: FC<{ itemType: ItemType }> = ({ itemType }) => {
  //TODO: connect to context
  const [colorPartitionSpec, setColorPartitionSpec] = useState<Partial<ColorPartitionSpec>>();
  const [palette, setPalette] = useState<string[]>([]);
  const attributesIndex = itemType === "nodes" ? nodeAttributesIndex : edgeAttributesIndex;

  // init palette
  useEffect(() => {
    if (colorPartitionSpec?.attributeId && attributesIndex && colorPartitionSpec?.attributeId in attributesIndex) {
      const values = keys(attributesIndex[colorPartitionSpec.attributeId]);
      if (every(values, (v) => isColor(v))) {
        setPalette(values);
      } else setPalette(iwanthue(keys(attributesIndex[colorPartitionSpec.attributeId]).length));
    }
  }, [colorPartitionSpec?.attributeId, attributesIndex]);

  return (
    <div>
      <h4>Partition</h4>
      <AttributeSelect
        itemType={itemType}
        attributeId={colorPartitionSpec?.attributeId}
        attributesFilter={(a) => !!a.qualitative}
        defaultToFirstAttribute
        onChange={(attId) => {
          setColorPartitionSpec({ missingColor: colorPartitionSpec?.missingColor, attributeId: attId });
          setPalette([]);
        }}
      />
      {colorPartitionSpec &&
        palette &&
        colorPartitionSpec.attributeId &&
        colorPartitionSpec.attributeId in attributesIndex &&
        toPairs(attributesIndex[colorPartitionSpec.attributeId]).map(([value, nbItems], i) => {
          return (
            <div key={i}>
              <label>{value}</label>
              <input
                type="color"
                value={palette[i]}
                onChange={(e) => setPalette(palette.map((p, j) => (j === i ? e.target.value : p)))}
              />
            </div>
          );
        })}

      <button
        type="submit"
        disabled={!colorPartitionSpec || !colorPartitionSpec.attributeId || palette.length === 0}
        className="btn btn-primary"
        onClick={(event) => {
          // TODO: Fix event handler code
          if (colorPartitionSpec && colorPartitionSpec.attributeId && palette.length) {
            const newSpec = {
              ...colorPartitionSpec,
              colorPalette: fromPairs(
                keys(attributesIndex[colorPartitionSpec.attributeId]).map((value, i) => [value, palette[i]]),
              ),
            } as ColorPartitionSpec;
            setColorPartitionSpec(newSpec);
            console.log(`TODO: update context with colorPartitionSpec`, newSpec, palette);
          }
        }}
      >
        validate
      </button>
    </div>
  );
};
