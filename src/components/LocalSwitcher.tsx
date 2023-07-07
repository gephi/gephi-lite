import Select from "react-select";
import { FC } from "react";
import { toPairs } from "lodash";
import localeEmoji from "locale-emoji";

import { usePreferencesActions, usePreferences } from "../core/context/dataContexts";
import { locales } from "../locales/locales";

interface Option {
  value: string;
  label: string;
}

const availableLocales: Array<Option> = toPairs(locales)
  .filter(([key]) => process.env.NODE_ENV === "development" || key !== "dev")
  .map(([key, locale]) => ({
    value: key,
    label: `${localeEmoji(key)} ${locale.label}`,
  }));

export const LocalSwitcher: FC = () => {
  const { locale } = usePreferences();
  const { changeLocale } = usePreferencesActions();

  return (
    <div>
      <Select<Option>
        value={availableLocales.find((e) => e.value === locale)}
        options={availableLocales}
        onChange={(e) => changeLocale(e ? e.value : "en")}
        isSearchable
      />
    </div>
  );
};
