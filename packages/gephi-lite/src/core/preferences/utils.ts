import { gephiLiteParse, gephiLiteStringify } from "@gephi/gephi-lite-sdk";

import { resolveDatavizLocale } from "../datavizLocale";
import { Preferences } from "./types";

export function getEmptyPreferences(): Preferences {
  return {
    layoutsParameters: {},
    metrics: {},
    locale: resolveDatavizLocale(),
    theme: "auto",
  };
}

export function getCurrentPreferences(): Preferences {
  try {
    const rawPreferences = localStorage.getItem("preferences");
    const preferences = rawPreferences ? parsePreferences(rawPreferences) : null;
    const merged = { ...getEmptyPreferences(), ...preferences };
    // Keep UI language aligned with the portal/header locale on every load.
    merged.locale = resolveDatavizLocale();
    return merged;
  } catch (e) {
    console.error(e);
    return getEmptyPreferences();
  }
}

/**
 * Preferences lifecycle helpers (state serialization / deserialization):
 */
export function serializePreferences(preferences: Preferences): string {
  return gephiLiteStringify(preferences);
}

export function parsePreferences(rawPreferences: string): Preferences | null {
  try {
    // TODO:
    // Validate the actual data
    return gephiLiteParse(rawPreferences);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function getAppliedTheme(theme: Preferences["theme"]): "light" | "dark" {
  if (theme === "auto") {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    else return "light";
  }
  return theme;
}
