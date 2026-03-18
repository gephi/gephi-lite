import { gephiLiteParse, gephiLiteStringify } from "@gephi/gephi-lite-sdk";

import { Preferences } from "./types";

const SUPPORTED_LOCALES = ["ja", "en"];

function detectBrowserLocale(): string {
  const browserLang = navigator.language?.split("-")[0] || "en";
  return SUPPORTED_LOCALES.includes(browserLang) ? browserLang : "en";
}

export function getEmptyPreferences(): Preferences {
  return {
    layoutsParameters: {},
    metrics: {},
    // detect browser language, fallback to "en"
    locale: detectBrowserLocale(),
    theme: "auto",
  };
}

export function getCurrentPreferences(): Preferences {
  try {
    const rawPreferences = localStorage.getItem("preferences");
    const preferences = rawPreferences ? parsePreferences(rawPreferences) : null;
    const merged = { ...getEmptyPreferences(), ...preferences };
    // Always use browser language detection for locale
    merged.locale = detectBrowserLocale();
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
