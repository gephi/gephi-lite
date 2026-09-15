import { preferencesAtom } from "./atom";
import { getAppliedTheme, serializePreferences } from "./utils";

preferencesAtom.bind((preferences, prevPreferences) => {
  localStorage.setItem("preferences", serializePreferences(preferences));

  // Apply theme change
  if (prevPreferences.theme !== preferences.theme || !document.documentElement.getAttribute("data-bs-theme")) {
    document.documentElement.setAttribute("data-bs-theme", getAppliedTheme(preferences.theme));
  }
});
