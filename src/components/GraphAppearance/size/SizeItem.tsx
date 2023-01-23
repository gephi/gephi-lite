import { FC, useState } from "react";
import { SizeRankingEditor } from "./SizeRankingEditor";
import { SizeStaticEditor } from "./SizeStaticEditor";
import { SizeFixedEditor } from "./SizeFixedEditor";
import { ItemType } from "../../../core/types";

type sizeMode = "fixed" | "quanti" | "static";

export const SizeItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const [sizeMode, setSizeMode] = useState<sizeMode>("fixed");

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h3>Size</h3>
      <label htmlFor="sizeMode">Set size from</label>
      <select
        id="sizeMode"
        className="form-select"
        value={sizeMode}
        onChange={(e) => setSizeMode(e.target.value as sizeMode)}
      >
        <option value="fixed">fixed size</option>
        <option value="quanti">Ranking (quantitative attribute)</option>
        <option value="static">Static (size attribute)</option>
      </select>

      {sizeMode === "fixed" && <SizeFixedEditor itemType={itemType} />}
      {sizeMode === "quanti" && <SizeRankingEditor itemType={itemType} />}
      {sizeMode === "static" && <SizeStaticEditor itemType={itemType} />}
    </form>
  );
};
