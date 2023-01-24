import { FC } from "react";
import { useTranslation } from "react-i18next";
import { GraphAppearance } from "../../components/GraphAppearance";

export const AppearancePanel: FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t("appearance.title")}</h2>
      <GraphAppearance />
      <p>CAPTION?</p>
    </div>
  );
};
