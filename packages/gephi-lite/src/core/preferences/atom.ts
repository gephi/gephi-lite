import { atom } from "@ouestware/atoms";

import { Preferences } from "./types";
import { getCurrentPreferences } from "./utils";

export const preferencesAtom = atom<Preferences>(getCurrentPreferences());
