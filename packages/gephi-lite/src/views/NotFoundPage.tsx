import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Layout } from "./layout";
import { Header } from "./layout/Header";

export const NotFoundPage: FC = () => {
  const { t } = useTranslation("translation");
  return (
    <>
      <Header />
      <Layout>
        <h1>{t("error.not_found.title")}</h1>
        <h2>{t("error.not_found.subtitle")} </h2>
        <p>{t("error.not_found.paragraph")}</p>
      </Layout>
    </>
  );
};
