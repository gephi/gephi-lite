import { FC } from "react";
import { useTranslation } from "react-i18next";
import { GraphMetadataForm } from "../../components/forms/GraphMetadataForm";
import { GraphModelForm } from "../../components/forms/GraphModelForm";
import { GraphPartitioning } from "../../components/GraphPartitioning";

export const GraphDataPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h4>{t("graph.metadata.title")}</h4>
      <GraphMetadataForm />
      <h4>{t("graph.partitioning.title")}</h4>
      <GraphPartitioning />
      <h4>{t("graph.model.title")}</h4>
      <GraphModelForm />
    </div>
  );
};
