import { Producer, atom, producerToAction } from "@ouestware/atoms";

import { localStorage } from "../../utils/storage";
import { ItemType } from "../types";
import { Preferences, SelectionSortMode } from "./types";
import { getAppliedTheme, getCurrentPreferences, serializePreferences } from "./utils";

/**
 * Producers:
 * **********
 */
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

const changeSelectionSort: Producer<Preferences, [ItemType, SelectionSortMode]> = (itemType, mode) => {
  return (preferences) => ({
    ...preferences,
    selectionSort: { ...preferences.selectionSort, [itemType]: mode },
  });
};

/**
 * Public API:
 * ***********
 */
export const preferencesAtom = atom<Preferences>(getCurrentPreferences());

export const preferencesActions = {
  changeLocale: producerToAction(changeLocale, preferencesAtom),
  changeTheme: producerToAction(changeTheme, preferencesAtom),
  changeSelectionSort: producerToAction(changeSelectionSort, preferencesAtom),
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
