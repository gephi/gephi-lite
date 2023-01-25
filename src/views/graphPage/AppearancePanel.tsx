import { FC } from "react";
import { useTranslation } from "react-i18next";

import { GraphAppearance } from "../../components/GraphAppearance";
import { AppearanceIcon } from "../../components/common-icons";

export const AppearancePanel: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <h2 className="fs-4">
        <AppearanceIcon className="me-1" /> {t("appearance.title")}
      </h2>
      <GraphAppearance />
    </>
  );
};
