import { PartitionColor, RankingColor } from "@gephi/gephi-lite-sdk";
import { Producer, atom, producerToAction } from "@ouestware/atoms";

import { localStorage } from "../../utils/storage";
import { Preferences } from "./types";
import { getAppliedTheme, getCurrentPreferences, isSameField, serializePreferences } from "./utils";

// Maximum number of color palette to keep in history
// Gephi Lite will save up to this number of partitions and this number of rankings in localstorage
const MAX_NB_SAVED_COLOR_SPECS = 20;

/**
 * Producers:
 * **********
 */
const changeLocale: Producer<Preferences, [Preferences["locale"]]> = (locale) => {
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

const newColorPaletteUsage: Producer<Preferences, [PartitionColor | RankingColor]> = (partitionRankingColor) => {
  const paletteType = partitionRankingColor.type;
  return (preferences) => ({
    ...preferences,
    colors: {
      ...preferences.colors,
      [paletteType]: [
        partitionRankingColor,
        // add the new spec at beginning of pref removing the previous spec on the same field if already there
        ...(preferences.colors[paletteType]?.filter((p) => !isSameField(p.field, partitionRankingColor.field)) || []),
        // cut the cache to max length set in config
      ].slice(0, MAX_NB_SAVED_COLOR_SPECS),
    },
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
  newColorPaletteUsage: producerToAction(newColorPaletteUsage, preferencesAtom),
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
