import { AppearanceState, getEmptyAppearanceState } from "@gephi/gephi-lite-sdk";
import { atom } from "@ouestware/atoms";

export const appearanceAtom = atom<AppearanceState>(getEmptyAppearanceState());
