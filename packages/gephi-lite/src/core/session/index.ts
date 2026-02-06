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

const setLastLayoutUsed: Producer<Session, [Session["lastLayoutUsed"]]> = (lastLayoutUsed) => {
  return (session) => ({
    ...session,
    lastLayoutUsed,
  });
};

export const sessionActions = {
  reset: producerToAction(reset, sessionAtom),
  setLastLayoutUsed: producerToAction(setLastLayoutUsed, sessionAtom),
};

/**
 * Bindings:
 * *********
 */
sessionAtom.bind((session) => {
  sessionStorage.setItem("session", serializeSession(session));
});
