import dev from "./dev.json";
import en from "./en.json";
import fr from "./fr.json";
import hu from "./hu.json";
import ja from "./ja.json";
import ko from "./ko.json";

export const LOCALES = {
  dev: {
    translation: dev,
    label: "Dev language",
  },
  ja: {
    translation: ja,
    label: "日本語",
  },
  ko: {
    translation: ko,
    label: "한국인",
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
  }
};

export const DEFAULT_LOCALE = "en";
