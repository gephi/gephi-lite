import { FC } from "react";
import { useTranslation } from "react-i18next";
import { GraphMetadataForm } from "../../components/forms/GraphMetadataForm";
import { GraphModelForm } from "../../components/forms/GraphModelForm";
import { GraphIcon } from "../../components/common-icons";

export const GraphDataPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="panel-block">
        <h2 className="fs-4">
          <GraphIcon className="me-1" /> {t("graph.title")}
        </h2>
      </div>

      <hr className="m-0" />

      <div className="panel-block-grow">
        <h3 className="fs-5">{t("graph.metadata.title")}</h3>
        <GraphMetadataForm />

        <br />

        <h3 className="fs-5">{t("graph.model.title")}</h3>
        <GraphModelForm />
      </div>
    </>
  );
};
