import { FC } from "react";
import { useTranslation } from "react-i18next";
import { FiltersIcon } from "../../components/common-icons";
import GraphFilters from "../../components/GraphFilters";

export const FiltersPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="fs-4">
        <FiltersIcon className="me-1" /> {t("filters.title")}
      </h2>
      <p className="text-muted small">{t("filters.description")}</p>
      <GraphFilters />
    </div>
  );
};
