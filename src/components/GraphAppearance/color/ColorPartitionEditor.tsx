import { every, flatMap, map, uniq } from "lodash";
import { FC, useEffect } from "react";
import iwanthue from "iwanthue";
import { isColor } from "./utils";
import { ItemType } from "../../../core/types";
import { PartitionColor } from "../../../core/appearance/types";
import { graphDatasetAtom } from "../../../core/graph";

export const ColorPartitionEditor: FC<{
  itemType: ItemType;
  color: PartitionColor;
  setColor: (newColor: PartitionColor) => void;
}> = ({ itemType, color, setColor }) => {
  // init palette
  useEffect(() => {
    const values = uniq(
      flatMap(graphDatasetAtom.get().nodeData, (nodeData) => {
        const v = nodeData[color.field];
        if (typeof v === "number" || (typeof v === "string" && !!v)) return [v + ""];
        return [];
      }),
    ) as string[];

    if (every(values, (v) => isColor(v))) {
      setColor({
        ...color,
        colorPalette: values.reduce((iter, v) => ({ ...iter, [v]: v }), {}),
      });
    } else {
      const palette = iwanthue(values.length);
      setColor({
        ...color,
        colorPalette: values.reduce((iter, v, i) => ({ ...iter, [v]: palette[i] }), {}),
      });
    }
  }, [color.field]);

  return (
    <div>
      <h4>Partition</h4>
      {map(color.colorPalette, (c, value) => {
        return (
          <div key={value}>
            <label>{value}</label>
            <input
              type="color"
              value={c}
              onChange={(e) =>
                setColor({
                  ...color,
                  colorPalette: {
                    ...color.colorPalette,
                    [value]: e.target.value,
                  },
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
};
