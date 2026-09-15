import { atom } from "@ouestware/atoms";

import { DataTableState } from "./types";
import { getEmptyDataTableState } from "./utils";

export const dataTableAtom = atom<DataTableState>(getEmptyDataTableState());
