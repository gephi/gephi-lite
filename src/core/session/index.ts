import { atom } from "../utils/atoms";
import { Producer, producerToAction } from "../utils/producers";
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

export const sessionActions = {
  reset: producerToAction(reset, sessionAtom),
};

/**
 * Bindings:
 * *********
 */
sessionAtom.bind((session) => {
  sessionStorage.setItem("session", serializeSession(session));
});
