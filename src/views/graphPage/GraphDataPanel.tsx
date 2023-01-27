import { FC } from "react";
import { useTranslation } from "react-i18next";
import { GraphMetadataForm } from "../../components/forms/GraphMetadataForm";
import { GraphModelForm } from "../../components/forms/GraphModelForm";
import { GraphIcon } from "../../components/common-icons";
//import { GraphPartitioning } from "../../components/GraphPartitioning";

export const GraphDataPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="fs-4">
        <GraphIcon className="me-1" /> {t("graph.title")}
      </h2>
      <hr />
      <h3 className="fs-5 mt-2">{t("graph.metadata.title")}</h3>
      <GraphMetadataForm />
      {/*<h3 className="fs-5  mt-3">{t("graph.partitioning.title")}</h3>
       <GraphPartitioning /> */}
      <hr />
      <h3 className="fs-5 mt-3">{t("graph.model.title")}</h3>
      <GraphModelForm />
    </div>
  );
};
