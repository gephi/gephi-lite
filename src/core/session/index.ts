import { atom } from "../utils/atoms";
import { Session } from "./types";
import { getEmptySession, serializeSession } from "./utils";
// import { Producer, producerToAction } from "../utils/reducers";

/**
 * Producers:
 * **********
 */

/**
 * Public API:
 * ***********
 */
export const sessionAtom = atom<Session>(getEmptySession());

export const sessionActions = {};

/**
 * Bindings:
 * *********
 */
sessionAtom.bind((session) => {
  sessionStorage.setItem("session", serializeSession(session));
});
