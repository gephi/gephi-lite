import { FC } from "react";
import { useTranslation } from "react-i18next";

export const FiltersPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t("filters.title")}</h2>
      <p>TODO</p>
    </div>
  );
};
