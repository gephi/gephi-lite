import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppearance, useAppearanceActions } from "../../core/context/dataContexts";
import { ItemType } from "../../core/types";
import ColorPicker from "../ColorPicker";
import { ToggleBar } from "../Toggle";
import { EdgeIcon, GraphIcon, NodeIcon } from "../common-icons";
import { ColorItem } from "./color/ColorItem";
import { LabelItem } from "./label/LabelItem";
import { LabelSizeItem } from "./label/LabelSizeItem";
import { SizeItem } from "./size/SizeItem";

export const GraphAppearance: FC = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("nodes");

  const tabs = useMemo(() => {
    return [
      {
        value: "nodes",
        label: (
          <>
            <NodeIcon className="me-1" /> {t("graph.model.nodes")}
          </>
        ),
      },
      {
        value: "edges",
        label: (
          <>
            <EdgeIcon className="me-1" /> {t("graph.model.edges")}
          </>
        ),
      },
      {
        value: "graph",
        label: (
          <>
            <GraphIcon className="me-1" /> {t("graph.model.graph")}
          </>
        ),
      },
    ];
  }, [t]);

  return (
    <>
      <ToggleBar className="mt-1" value={selected} onChange={(e) => setSelected(e)} options={tabs} />
      <hr className="m-0" />
      <div className="panel-block">
        {selected === "nodes" && <GraphItemAppearance itemType="nodes" />}
        {selected === "edges" && <GraphItemAppearance itemType="edges" />}
        {selected === "graph" && <GraphGraphAppearance />}
      </div>
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
        <div className="panel-block">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={showEdges.value}
              onChange={(e) => setShowEdges({ itemType: "edges", value: e.target.checked })}
              id="show-edges"
            />
            <label className="form-check-label" htmlFor="show-edges">
              {t("appearance.show_edges")}
            </label>
          </div>
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

const GraphGraphAppearance: FC<unknown> = () => {
  const { t } = useTranslation();
  const { backgroundColor } = useAppearance();
  const { setBackgroundColorAppearance } = useAppearanceActions();

  return (
    <div className="panel-block">
      <h3 className="fs-5">{t("appearance.graph.background.title")}</h3>

      <div className="d-flex align-items-center">
        <label className="me-3">{t("appearance.graph.background.color")}</label>
        <ColorPicker color={backgroundColor} clearable onChange={(v) => setBackgroundColorAppearance(v)} />
      </div>
    </div>
  );
};
