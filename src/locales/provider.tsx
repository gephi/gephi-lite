import { FC, PropsWithChildren, useEffect } from "react";
import { capitalize } from "lodash";
import i18next from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import LngDetector from "i18next-browser-languagedetector";

import { usePreferences } from "../core/context/dataContexts";
import { LOCALES } from "./LOCALES";

const i18n = i18next.use(initReactI18next).use(LngDetector);

i18n
  .init({
    debug: process.env.NODE_ENV !== "production",
    fallbackLng: "dev",
    resources: LOCALES,
    detection: {
      order: ["querystring", "navigator"],
      lookupQuerystring: "lang",
    },
  })
  .then(() => {
    i18next.services.formatter?.add("lowercase", (value, lng, options) => {
      return value.toLowerCase();
    });
    i18next.services.formatter?.add("capitalize", (value, lng, options) => {
      return capitalize(value);
    });
  });

export { i18n };

export const I18n: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { locale } = usePreferences();

  useEffect(() => {
    if (locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
