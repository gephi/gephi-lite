import { atom } from "@ouestware/atoms";

import { Session } from "./types";
import { getEmptySession } from "./utils";

export const sessionAtom = atom<Session>(getEmptySession());
