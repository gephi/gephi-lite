import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Layout } from "./layout";
import { Header } from "./layout/Header";

export const ErrorPage: FC = () => {
  const { t } = useTranslation("translation");
  return (
    <>
      <Header />
      <Layout>
        <h1>{t("error.title")}</h1>
      </Layout>
    </>
  );
};
