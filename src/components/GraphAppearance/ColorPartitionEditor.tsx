import { fromPairs, keys, toPairs } from "lodash";
import { FC, useEffect, useState } from "react";
import { AttributeSelect } from "../forms/AttributeSelect";
import { NodeEdgeProps } from "../forms/NodeEdgeTabs";
import iwanthue from "iwanthue";

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
};
const edgeAttributesIndex: AttributeValueIndex = {
  weight: { "1.2": 1, "1.5": 1, "0.2": 5 },
  type: { knows: 12, hates: 10 },
};

export const ColorPartitionEditor: FC<NodeEdgeProps> = ({ nodeEdge }) => {
  //TODO: connect to context
  const [colorPartitionSpec, setColorPartitionSpec] = useState<Partial<ColorPartitionSpec>>();
  const [palette, setPalette] = useState<string[]>([]);
  const attributesIndex = nodeEdge === "node" ? nodeAttributesIndex : edgeAttributesIndex;

  // init palette
  useEffect(() => {
    if (colorPartitionSpec?.attributeId && attributesIndex && colorPartitionSpec?.attributeId in attributesIndex) {
      setPalette(iwanthue(keys(attributesIndex[colorPartitionSpec.attributeId]).length));
    }
  }, [colorPartitionSpec?.attributeId, attributesIndex]);

  // update spec from palette
  useEffect(() => {
    if (
      palette &&
      colorPartitionSpec &&
      colorPartitionSpec?.attributeId &&
      attributesIndex &&
      colorPartitionSpec?.attributeId in attributesIndex
    ) {
      const newSpec = {
        ...colorPartitionSpec,
        colorPalette: fromPairs(
          keys(attributesIndex[colorPartitionSpec.attributeId]).map((value, i) => [value, palette[i]]),
        ),
      } as ColorPartitionSpec;
      console.log(`TODO: update context with colorPartitionSpec`, newSpec);
    }
  }, [palette, colorPartitionSpec, attributesIndex]);

  return (
    <div>
      <h4>Partition</h4>
      <AttributeSelect
        nodeEdge={nodeEdge}
        attributeId={colorPartitionSpec?.attributeId}
        attributesFilter={(a) => !!a.qualitative}
        defaultToFirstAttribute
        onChange={(attId) => setColorPartitionSpec({ ...colorPartitionSpec, attributeId: attId })}
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
    </div>
  );
};
