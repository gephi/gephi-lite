import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorItem } from "./color/ColorItem";
import { ItemType } from "../../core/types";
import { SizeItem } from "./size/SizeItem";
import { LabelItem } from "./label/LabelItem";
import { LabelSizeItem } from "./label/LabelSizeItem";
import { Toggle } from "../Toggle";
import { EdgeIcon, NodeIcon } from "../common-icons";
import { useAppearance, useAppearanceActions } from "../../core/context/dataContexts";

export const GraphAppearance: FC = () => {
  const { t } = useTranslation();
  const [showEdges, setShowEdges] = useState(false);

  return (
    <>
      <div className="panel-block">
        <Toggle
          value={showEdges}
          onChange={setShowEdges}
          leftLabel={
            <>
              <NodeIcon className="me-1" /> {t("graph.model.nodes")}
            </>
          }
          rightLabel={
            <>
              <EdgeIcon className="me-1" /> {t("graph.model.edges")}
            </>
          }
        />
      </div>

      <hr className="m-0" />

      {showEdges ? <GraphItemAppearance itemType="edges" /> : <GraphItemAppearance itemType="nodes" />}
    </>
  );
};

const GraphItemAppearance: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { showEdges } = useAppearance();
  const { setShowEdges } = useAppearanceActions();

  return (
    <>
      {itemType === "edges" && (
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={showEdges}
            onChange={(e) => setShowEdges(e.target.checked)}
            id="show-edges"
          />
          <label className="form-check-label" htmlFor="show-edges">
            {t("appearance.show_edges")}
          </label>
        </div>
      )}

      <ColorItem itemType={itemType} />
      <hr className="m-0" />
      <SizeItem itemType={itemType} />
      <hr className="m-0" />
      <LabelItem itemType={itemType} />
      <LabelSizeItem itemType={itemType} />
    </>
  );
};
