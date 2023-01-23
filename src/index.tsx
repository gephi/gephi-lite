import React from "react";
import ReactDOM from "react-dom/client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LngDetector from "i18next-browser-languagedetector";
import locales from "./locales";

import reportWebVitals from "./reportWebVitals";
import { Root } from "./core/Root";

import "./styles/index.scss";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

i18n
  .use(initReactI18next)
  .use(LngDetector)
  .init({
    debug: true,
    resources: locales,
    detection: {
      order: ["querystring", "navigator"],
      lookupQuerystring: "lng",
    },
  });

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
