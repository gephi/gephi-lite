import { FC } from "react";
import { useTranslation } from "react-i18next";
import GraphFilters from "../../components/GraphFilters";

export const FiltersPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t("filters.title")}</h2>
      <GraphFilters />
    </div>
  );
};
