import { Producer, atom, producerToAction } from "@ouestware/atoms";

import { sessionStorage } from "../../utils/storage";
import { Session } from "./types";
import { getEmptySession, serializeSession } from "./utils";

/**
 * Producers:
 * **********
 */

/**
 * Public API:
 * ***********
 */
export const sessionAtom = atom<Session>(getEmptySession());

export const reset: Producer<Session, []> = () => {
  return () => getEmptySession();
};

const setFullState: Producer<Session, [Session]> = (newState) => {
  return () => newState;
};

export const sessionActions = {
  reset: producerToAction(reset, sessionAtom),
  setFullState: producerToAction(setFullState, sessionAtom),
};

/**
 * Bindings:
 * *********
 */
sessionAtom.bind((session) => {
  sessionStorage.setItem("session", serializeSession(session));
});
