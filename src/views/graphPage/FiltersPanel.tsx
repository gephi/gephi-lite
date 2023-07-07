import { FC } from "react";
import { useTranslation } from "react-i18next";
import { FiltersIcon } from "../../components/common-icons";
import GraphFilters from "../../components/GraphFilters";

export const FiltersPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="panel-block">
        <h2 className="fs-4">
          <FiltersIcon className="me-1" /> {t("filters.title")}
        </h2>
        <p className="text-muted small m-0">{t("filters.description")}</p>
      </div>

      <hr className="m-0" />

      <GraphFilters />
    </>
  );
};
