import { FiltersState, getEmptyFiltersState } from "@gephi/gephi-lite-sdk";
import { atom } from "@ouestware/atoms";

export const filtersAtom = atom<FiltersState>(getEmptyFiltersState());
