import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Layout } from "./layout";

export const ErrorPage: FC = () => {
  const { t } = useTranslation("translation");
  return (
    <Layout>
      <h1>{t("error.title")}</h1>
    </Layout>
  );
};
