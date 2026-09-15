import { atom } from "@ouestware/atoms";

import { FileState } from "./types";
import { getLocalStorageFileState } from "./utils";

export const fileAtom = atom<FileState>(getLocalStorageFileState());
