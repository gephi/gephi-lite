import { FC, useState } from "react";
import { ColorItem } from "./color/ColorItem";
import { ItemType } from "../../core/types";
import { Tabs } from "../Tabs";

export const GraphAppearance: FC = () => {
  return (
    <Tabs>
      <>Nodes</>
      <GraphItemAppearance itemType="nodes" />
      <>Edges</>
      <GraphItemAppearance itemType="edges" />
    </Tabs>
  );
};

const GraphItemAppearance: FC<{ itemType: ItemType }> = ({ itemType }) => {
  //TODO: retrieve partition from CONTEXT and split by partitions
  const [edgesHidden, setEdgesHidden] = useState<boolean>(false);
  //TODO: replace by core.model types once done

  return (
    <div>
      {itemType === "edges" && (
        <button className="btn btn-primary" onClick={() => setEdgesHidden(!edgesHidden)}>
          {edgesHidden ? "Show" : "Hide"} edges
        </button>
      )}

      {
        // COLOR
      }
      <ColorItem itemType={itemType} />
      {
        // SIZE
      }
      <h4>Size</h4>

      {
        // LABELS
      }
      <h4>Labels</h4>
    </div>
  );
};
