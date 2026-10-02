import cx from "classnames";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePreferences, usePreferencesActions } from "../core/context/dataContexts";
import { useMobile } from "../hooks/useMobile";
import Dropdown from "./Dropdown";
import {
  AutoThemeIcon,
  AutoThemeSelectedIcon,
  CheckedIcon,
  DarkThemeIcon,
  DarkThemeSelectedIcon,
  LightThemeIcon,
  LightThemeSelectedIcon,
} from "./common-icons";

/**
 * The theme entries, shared by the switcher below and by the Gephi-Lite menu, which offers them
 * directly on mobile (where there is no room for a switcher of its own).
 */
export function useThemeOptions() {
  const { theme } = usePreferences();
  const { changeTheme } = usePreferencesActions();
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: (
          <span>
            {theme === "auto" ? <AutoThemeSelectedIcon /> : <AutoThemeIcon />}
            <span className="mx-1">{t("settings.theme.auto")}</span>
            {theme === "auto" && <CheckedIcon className="float-end" />}
          </span>
        ),
        onClick: () => changeTheme("auto"),
      },
      {
        label: (
          <span>
            {theme === "light" ? <LightThemeSelectedIcon /> : <LightThemeIcon />}
            <span className="mx-1">{t("settings.theme.light")}</span>
            {theme === "light" && <CheckedIcon className="float-end" />}
          </span>
        ),
        onClick: () => changeTheme("light"),
      },
      {
        label: (
          <span>
            {theme === "dark" ? <DarkThemeIcon /> : <DarkThemeIcon />}
            <span className="mx-1">{t("settings.theme.dark")}</span>
            {theme === "dark" && <CheckedIcon className="float-end" />}
          </span>
        ),
        onClick: () => changeTheme("dark"),
      },
    ],
    [t, theme, changeTheme],
  );
}

export const ThemeSwitcher: FC<unknown> = () => {
  const { theme } = usePreferences();
  const isMobile = useMobile();
  const themeOptions = useThemeOptions();

  return (
    <Dropdown options={themeOptions} side="right">
      <button className={cx("gl-btn w-100", !isMobile && "dropdown-toggle")}>
        {theme === "auto" && <AutoThemeSelectedIcon />}
        {theme === "light" && <LightThemeSelectedIcon />}
        {theme === "dark" && <DarkThemeSelectedIcon />}
      </button>
    </Dropdown>
  );
};
