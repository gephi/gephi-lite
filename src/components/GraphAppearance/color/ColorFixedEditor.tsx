import { FC, useState } from "react";
import { NodeEdgeProps } from "../../forms/NodeEdgeTabs";

export const ColorFixedEditor: FC<NodeEdgeProps> = ({ nodeEdge }) => {
  const [fixedColor, setFixedColor] = useState<string>("#EEEEEE");
  return (
    <div>
      <input type="color" value={fixedColor} onChange={(v) => setFixedColor(v.target.value)} />
      <button
        type="submit"
        onClick={() => {
          console.log(`TODO: set state ${fixedColor}`);
        }}
      >
        validate
      </button>
    </div>
  );
};
