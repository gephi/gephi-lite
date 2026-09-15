import { PartitionColor, RankingColor } from "@gephi/gephi-lite-sdk";
import { Producer, producerToAction } from "@ouestware/atoms";

import { preferencesAtom } from "./atom";
import { Preferences } from "./types";
import { isSameField } from "./utils";

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

const setMapStyle: Producer<Preferences, [Preferences["mapStyle"]]> = (mapStyle) => {
  return (preferences) => ({
    ...preferences,
    mapStyle,
  });
};

export const preferencesActions = {
  changeLocale: producerToAction(changeLocale, preferencesAtom),
  changeTheme: producerToAction(changeTheme, preferencesAtom),
  newColorPaletteUsage: producerToAction(newColorPaletteUsage, preferencesAtom),
  setMapStyle: producerToAction(setMapStyle, preferencesAtom),
};
