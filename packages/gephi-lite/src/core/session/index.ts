import { Producer, atom, producerToAction } from "@ouestware/atoms";

import { sessionStorage } from "../../utils/storage";
import { Session } from "./types";
import { getEmptySession, serializeSession } from "./utils";

/**
 * Public API:
 * ***********
 */
export const sessionAtom = atom<Session>(getEmptySession());

/**
 * Producers:
 * **********
 */
export const reset: Producer<Session, []> = () => {
  return () => getEmptySession();
};

const setLastLayout: Producer<Session, [Session["lastLayout"]]> = (layoutId) => {
  return (session) => ({
    ...session,
    lastLayout: layoutId
  });
};

export const sessionActions = {
  reset: producerToAction(reset, sessionAtom),
  setLastLayout: producerToAction(setLastLayout, sessionAtom),
};

/**
 * Bindings:
 * *********
 */
sessionAtom.bind((session) => {
  sessionStorage.setItem("session", serializeSession(session));
});
