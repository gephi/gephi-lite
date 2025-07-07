import type { ItemType } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { LabelEllipsis } from "../../../components/GraphAppearance/label/LabelEllipsis";
import { LabelSizeItem } from "../../../components/GraphAppearance/label/LabelSizeItem";
import { StringAttrItem } from "../../../components/GraphAppearance/label/StringAttrItem";

const LabelItemSettings: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  return (
    <div className="panel-block">
      <h3>{t(`graph.model.${itemType}`)}</h3>
      <StringAttrItem itemType={itemType} itemKey="labels" />
      <LabelSizeItem itemType={itemType} />
      <LabelEllipsis itemType={itemType} />
    </div>
  );
};
export const LabelsPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div className="panel-body">
      <h2>{t("appearance.menu.labels")}</h2>

      <LabelItemSettings itemType="nodes" />
      <LabelItemSettings itemType="edges" />
    </div>
  );
};
