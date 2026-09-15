import dev from "./dev.json";
import en from "./en.json";
import fr from "./fr.json";
import hu from "./hu.json";
import ko from "./ko.json";
import uk from "./uk.json";

export const LOCALES = {
  dev: {
    translation: dev,
    label: "Dev language",
  },
  en: {
    translation: en,
    label: "English",
  },
  fr: {
    translation: fr,
    label: "Français",
  },
  hu: {
    translation: hu,
    label: "Magyar",
  },
  ko: {
    translation: ko,
    label: "한국인",
  },
  uk: {
    translation: uk,
    label: "Yкраїнська",
  },
};

export const DEFAULT_LOCALE = import.meta.env.NODE_ENV !== "production" ? "dev" : "en";
