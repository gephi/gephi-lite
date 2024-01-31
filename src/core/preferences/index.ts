import { isEqual } from "lodash";

import { RemoteFile } from "../graph/import/types";
import { atom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/producers";
import { Preferences } from "./types";
import { getAppliedTheme, getCurrentPreferences, serializePreferences } from "./utils";

/**
 * Producers:
 * **********
 */
const addRemoteFile: Producer<Preferences, [RemoteFile]> = (file) => {
  return (preferences) => ({
    ...preferences,
    recentRemoteFiles: [file, ...preferences.recentRemoteFiles.filter((f) => !isEqual(f, file))].slice(0, 5),
  });
};

const changeLocale: Producer<Preferences, [string]> = (locale) => {
  // save the new locale in the state
  return (preferences) => ({
    ...preferences,
    locale,
  });
};

const changeTheme: Producer<Preferences, [Preferences["theme"]]> = (theme) => {
  return (preferences) => ({
    ...preferences,
    theme,
  });
};

/**
 * Public API:
 * ***********
 */
export const preferencesAtom = atom<Preferences>(getCurrentPreferences());

export const preferencesActions = {
  addRemoteFile: producerToAction(addRemoteFile, preferencesAtom),
  changeLocale: producerToAction(changeLocale, preferencesAtom),
  changeTheme: producerToAction(changeTheme, preferencesAtom),
};

/**
 * Bindings:
 * *********
 */
preferencesAtom.bind((preferences, prevPreferences) => {
  localStorage.setItem("preferences", serializePreferences(preferences));

  // Apply theme change
  if (prevPreferences.theme !== preferences.theme || !document.documentElement.getAttribute("data-bs-theme")) {
    document.documentElement.setAttribute("data-bs-theme", getAppliedTheme(preferences.theme));
  }
});
