import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorItem } from "./color/ColorItem";
import { ItemType } from "../../core/types";
import { Tabs } from "../Tabs";
import { SizeItem } from "./size/SizeItem";
import { LabelItem } from "./label/LabelItem";
import { LabelSizeItem } from "./label/LabelSizeItem";

export const GraphAppearance: FC = () => {
  const { t } = useTranslation();
  return (
    <Tabs>
      <>{t("graph.model.nodes")}</>
      <GraphItemAppearance itemType="nodes" />
      <>{t("graph.model.edges")}</>
      <GraphItemAppearance itemType="edges" />
    </Tabs>
  );
};

const GraphItemAppearance: FC<{ itemType: ItemType }> = ({ itemType }) => {
  //TODO: retrieve partition from CONTEXT and split by partitions
  const [edgesHidden, setEdgesHidden] = useState<boolean>(false);
  //TODO: replace by core.model types once done
  const { t } = useTranslation();
  return (
    <div>
      {itemType === "edges" && (
        <button className="btn btn-primary" onClick={() => setEdgesHidden(!edgesHidden)}>
          {edgesHidden ? t("button.show") : t("button.hide")} {t("graph.model.edges")}
        </button>
      )}

      <ColorItem itemType={itemType} />
      <SizeItem itemType={itemType} />
      <LabelItem itemType={itemType} />
      <LabelSizeItem itemType={itemType} />
    </div>
  );
};
