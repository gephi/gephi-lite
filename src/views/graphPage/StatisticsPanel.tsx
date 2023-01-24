import { FC } from "react";
import { useTranslation } from "react-i18next";

export const StatisticsPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t("statistics.title")}</h2>
      <p>TODO</p>
    </div>
  );
};
