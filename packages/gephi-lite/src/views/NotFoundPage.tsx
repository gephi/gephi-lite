import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Layout } from "./layout";

export const NotFoundPage: FC = () => {
  const { t } = useTranslation("translation");
  return (
    <Layout>
      <h1>{t("error.not_found.title")}</h1>
      <h2>{t("error.not_found.subtitle")} </h2>
      <p>{t("error.not_found.paragraph")}</p>
    </Layout>
  );
};
