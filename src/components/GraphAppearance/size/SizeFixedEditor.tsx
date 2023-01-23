import { FC, useState } from "react";
import { ItemType } from "../../../core/types";

export const SizeFixedEditor: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const [fixedSize, setFixedSize] = useState<number>(5);
  return (
    <div>
      <input type="number" value={fixedSize} onChange={(v) => setFixedSize(+v.target.value)} />
      <button
        type="submit"
        className="btn btn-primary"
        onClick={() => {
          console.log(`TODO: set state ${itemType} ${fixedSize}`);
        }}
      >
        validate
      </button>
    </div>
  );
};
