import { atom } from "@ouestware/atoms";

import { SearchState } from "./types";
import { getEmptySearchState } from "./utils";

export const searchAtom = atom<SearchState>(getEmptySearchState());
