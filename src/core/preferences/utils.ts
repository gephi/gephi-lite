import { Preferences } from "./types";

export function getEmptyPreferences(): Preferences {
  return {
    recentRemoteFiles: [],
  };
}

export function getCurrentPreferences(): Preferences {
  try {
    const rawPreferences = localStorage.getItem("preferences");
    const preferences = rawPreferences ? parsePreferences(rawPreferences) : null;
    return preferences || getEmptyPreferences();
  } catch (e) {
    return getEmptyPreferences();
  }
}

/**
 * Preferences lifecycle helpers (state serialization / deserialization):
 */
export function serializePreferences(preferences: Preferences): string {
  return JSON.stringify(preferences);
}
export function parsePreferences(rawPreferences: string): Preferences | null {
  try {
    // TODO:
    // Validate the actual data
    return JSON.parse(rawPreferences);
  } catch (e) {
    return null;
  }
}
