import cx from "classnames";
import { toPairs } from "lodash";
import { FC, useMemo } from "react";

import { usePreferences, usePreferencesActions } from "../core/context/dataContexts";
import { useMobile } from "../hooks/useMobile";
import { LOCALES } from "../locales/LOCALES";
import Dropdown from "./Dropdown";
import { CheckedIcon, LanguageIcon } from "./common-icons";

const AVAILABLE_LOCALES = toPairs(LOCALES)
  .filter(([key]) => import.meta.env.MODE === "development" || key !== "dev")
  .map(([key, locale]) => ({
    value: key,
    label: <>{locale.label}</>,
  }));

/**
 * The language entries, shared by the switcher below and by the Gephi-Lite menu, which offers them
 * directly on mobile (where there is no room for a switcher of its own).
 */
export function useLocaleOptions() {
  const { locale } = usePreferences();
  const { changeLocale } = usePreferencesActions();

  return useMemo(
    () =>
      AVAILABLE_LOCALES.map((l) => ({
        label: (
          <span>
            <span className="me-1">{l.label}</span>
            {l.value === locale && <CheckedIcon className="float-end" />}
          </span>
        ),
        onClick: () => changeLocale(l.value),
      })),
    [locale, changeLocale],
  );
}

const LocalSwitcher: FC = () => {
  const { locale } = usePreferences();
  const isMobile = useMobile();
  const localeOptions = useLocaleOptions();

  return (
    <Dropdown options={localeOptions} side="right">
      <button
        className={cx("lang-switcher-btn gl-btn gl-btn-icon", !isMobile && "dropdown-toggle")}
        title={LOCALES[locale as keyof typeof LOCALES]?.label}
        aria-label={LOCALES[locale as keyof typeof LOCALES]?.label}
      >
        <LanguageIcon />
      </button>
    </Dropdown>
  );
};

export default LocalSwitcher;
