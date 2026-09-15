import { atom } from "@ouestware/atoms";

import { SelectionState } from "./types";
import { getEmptySelectionState } from "./utils";

export const selectionAtom = atom<SelectionState>(getEmptySelectionState());
