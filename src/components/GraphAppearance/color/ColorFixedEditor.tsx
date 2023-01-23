import { FC } from "react";
import { ItemType } from "../../../core/types";
import { FixedColor } from "../../../core/appearance/types";

export const ColorFixedEditor: FC<{
  itemType: ItemType;
  color: FixedColor;
  setColor: (newColor: FixedColor) => void;
}> = ({ color, setColor }) => {
  return (
    <div>
      <input type="color" value={color.value} onChange={(v) => setColor({ ...color, value: v.target.value })} />
    </div>
  );
};
