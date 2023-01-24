import { FC } from "react";
import { useTranslation } from "react-i18next";

export const LayoutPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t("layout.title")}</h2>
      <p>TODO</p>
    </div>
  );
};
