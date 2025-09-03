import cx from "classnames";
import { toPairs } from "lodash";
import { FC, useMemo } from "react";

import { usePreferences, usePreferencesActions } from "../core/context/dataContexts";
import { useMobile } from "../hooks/useMobile";
import { LOCALES } from "../locales/LOCALES";
import Dropdown from "./Dropdown";
import { CheckedIcon } from "./common-icons";

const AVAILABLE_LOCALES = toPairs(LOCALES)
  .filter(([key]) => import.meta.env.MODE === "development" || key !== "dev")
  .map(([key, locale]) => ({
    value: key,
    label: <>{locale.label}</>,
  }));

const LocalSwitcher: FC = () => {
  const { locale } = usePreferences();
  const { changeLocale } = usePreferencesActions();
  const isMobile = useMobile();

  const localeOptions = useMemo(
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

  return (
    <Dropdown options={localeOptions} side="right">
      <button className={cx("lang-switcher-btn gl-btn w-100", !isMobile && "dropdown-toggle")}>{locale}</button>
    </Dropdown>
  );
};

export default LocalSwitcher;
