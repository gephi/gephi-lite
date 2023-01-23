import { FC, useState } from "react";
import { ColorPartitionEditor } from "./ColorPartitionEditor";
import { ColorRankingEditor } from "./ColorRankingEditor";
import { ColorStaticEditor } from "./ColorStaticEditor";
import { ColorFixedEditor } from "./ColorFixedEditor";
import { ItemType } from "../../../core/types";

type colorMode = "fixed" | "quanti" | "quali" | "static";

export const ColorItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const [colorMode, setColorMode] = useState<colorMode>("fixed");

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h3>Color</h3>
      <label htmlFor="colorMode">Set color from</label>
      <select
        id="colorMode"
        className="form-select"
        value={colorMode}
        onChange={(e) => setColorMode(e.target.value as colorMode)}
      >
        <option value="fixed">fixed color</option>
        <option value="quanti">Ranking (quantitative attribute)</option>
        <option value="quali">Partition (qualitative attribute)</option>
        <option value="static">Static (color attribute)</option>
      </select>

      {colorMode === "fixed" && <ColorFixedEditor itemType={itemType} />}
      {colorMode === "quanti" && <ColorRankingEditor itemType={itemType} />}
      {colorMode === "quali" && <ColorPartitionEditor itemType={itemType} />}
      {colorMode === "static" && <ColorStaticEditor itemType={itemType} />}
    </form>
  );
};
