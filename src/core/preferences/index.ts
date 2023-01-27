import { isEqual } from "lodash";

import { atom } from "../utils/atoms";
import { Preferences } from "./types";
import { RemoteFile } from "../graph/types";
import { Producer, producerToAction } from "../utils/reducers";
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

/**
 * Public API:
 * ***********
 */
export const preferencesAtom = atom<Preferences>(getCurrentPreferences());

export const preferencesActions = {
  addRemoteFile: producerToAction(addRemoteFile, preferencesAtom),
};

/**
 * Bindings:
 * *********
 */
preferencesAtom.bind((preferences) => {
  localStorage.setItem("preferences", serializePreferences(preferences));
});
