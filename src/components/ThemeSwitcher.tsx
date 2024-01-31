import { FC } from "react";
import { MdContrast, MdDarkMode, MdLightMode } from "react-icons/md";

import { usePreferences, usePreferencesActions } from "../core/context/dataContexts";
import { Preferences } from "../core/preferences/types";
import Tooltip from "./Tooltip";

export const ThemeSwicther: FC<unknown> = () => {
  const { theme } = usePreferences();
  const { changeTheme } = usePreferencesActions();
  return (
    <Tooltip closeOnClickContent attachment="top middle" targetAttachment="bottom middle">
      <button className="btn p-0 fs-4">
        {theme === "auto" && <MdContrast />}
        {theme === "light" && <MdLightMode />}
        {theme === "dark" && <MdDarkMode />}
      </button>
      <div className="dropdown-menu show over-modal position-relative">
        {(["auto", "light", "dark"] as Preferences["theme"][]).map((theme) => (
          <button className="dropdown-item" onClick={() => changeTheme(theme)}>
            {theme === "auto" && (
              <span>
                <MdContrast /> Auto
              </span>
            )}
            {theme === "light" && (
              <span>
                <MdLightMode /> Light
              </span>
            )}
            {theme === "dark" && (
              <span>
                <MdDarkMode /> Dark
              </span>
            )}
          </button>
        ))}
      </div>
    </Tooltip>
  );
};
