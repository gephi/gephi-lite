import { parse, stringify } from "../utils/json";
import { Preferences } from "./types";

export function getEmptyPreferences(): Preferences {
  return {
    recentRemoteFiles: [],
    layoutsParameters: {},
    metrics: {},
    locale: "en",
  };
}

export function getCurrentPreferences(): Preferences {
  try {
    const rawPreferences = localStorage.getItem("preferences");
    const preferences = rawPreferences ? parsePreferences(rawPreferences) : null;
    return { ...preferences, ...getEmptyPreferences() };
  } catch (e) {
    return getEmptyPreferences();
  }
}

/**
 * Preferences lifecycle helpers (state serialization / deserialization):
 */
export function serializePreferences(preferences: Preferences): string {
  return stringify(preferences);
}

export function parsePreferences(rawPreferences: string): Preferences | null {
  try {
    // TODO:
    // Validate the actual data
    return parse(rawPreferences);
  } catch (e) {
    return null;
  }
}
