import { isEqual } from "lodash";

import { RemoteFile } from "../graph/import/types";
import { atom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/producers";
import { Preferences } from "./types";
import { getCurrentPreferences, serializePreferences } from "./utils";

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

/**
 * Public API:
 * ***********
 */
export const preferencesAtom = atom<Preferences>(getCurrentPreferences());

export const preferencesActions = {
  addRemoteFile: producerToAction(addRemoteFile, preferencesAtom),
  changeLocale: producerToAction(changeLocale, preferencesAtom),
};

/**
 * Bindings:
 * *********
 */
preferencesAtom.bind((preferences) => {
  localStorage.setItem("preferences", serializePreferences(preferences));
});
