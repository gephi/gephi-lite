import { FC } from "react";
import { ItemType } from "../../../core/types";
import { FixedSize } from "../../../core/appearance/types";

export const SizeFixedEditor: FC<{
  itemType: ItemType;
  size: FixedSize;
  setSize: (newSize: FixedSize) => void;
}> = ({ size, setSize }) => {
  return (
    <div>
      <input
        type="number"
        value={size.value}
        onChange={(e) =>
          setSize({
            ...size,
            value: +e.target.value,
          })
        }
      />
    </div>
  );
};
