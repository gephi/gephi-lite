import i18next from "i18next";
import LngDetector from "i18next-browser-languagedetector";
import { capitalize } from "lodash";
import { FC, PropsWithChildren, useEffect } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import { usePreferences } from "../core/context/dataContexts";
import { DEFAULT_LOCALE, LOCALES } from "./LOCALES";

const i18n = i18next.use(initReactI18next).use(LngDetector);

i18n
  .init({
    debug: import.meta.env.NODE_ENV !== "production",
    fallbackLng: DEFAULT_LOCALE,
    resources: LOCALES,
    detection: {
      order: ["querystring", "navigator"],
      lookupQuerystring: "lang",
      convertDetectedLanguage: (lng) => (lng in LOCALES ? lng : DEFAULT_LOCALE),
    },
  })
  .then(() => {
    i18next.services.formatter?.add("lowercase", (value, _lng, _options) => {
      return value.toLowerCase();
    });
    i18next.services.formatter?.add("capitalize", (value, _lng, _options) => {
      return capitalize(value);
    });
  });

export { i18n };

export const I18n: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { locale } = usePreferences();

  useEffect(() => {
    if (locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
