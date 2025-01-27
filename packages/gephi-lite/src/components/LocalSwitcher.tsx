import localeEmoji from "locale-emoji";
import { toPairs } from "lodash";
import { FC, ReactNode } from "react";
import { HiMiniLanguage } from "react-icons/hi2";

import { usePreferences, usePreferencesActions } from "../core/context/dataContexts";
import { LOCALES } from "../locales/LOCALES";
import Tooltip from "./Tooltip";

const DEFAULT_FLAG = <HiMiniLanguage className="fs-5" />;

function getIcon(locale: string): ReactNode {
  return locale === "dev" ? DEFAULT_FLAG : localeEmoji(locale) || DEFAULT_FLAG;
}
const AVAILABLE_LOCALES = toPairs(LOCALES)
  .filter(([key]) => import.meta.env.MODE === "development" || key !== "dev")
  .map(([key, locale]) => ({
    value: key,
    label: (
      <>
        {getIcon(key)} {locale.label}
      </>
    ),
  }));

const LocalSwitcher: FC = () => {
  const { locale } = usePreferences();
  const { changeLocale } = usePreferencesActions();
  return (
    <Tooltip closeOnClickContent attachment="top middle" targetAttachment="bottom middle">
      <button className="btn p-0 fs-4">{getIcon(locale)}</button>
      <div className="dropdown-menu show over-modal position-relative">
        {AVAILABLE_LOCALES.map((option, i) => (
          <button
            key={i}
            className="dropdown-item"
            onClick={() => {
              changeLocale(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Tooltip>
  );
};

export default LocalSwitcher;
