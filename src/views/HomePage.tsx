import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Layout } from "./layout";

export const HomePage: FC = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1>{t("home.greetings")}</h1>
            <p>{t("home.blabla")}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
