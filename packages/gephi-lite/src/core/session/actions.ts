import { Producer, producerToAction } from "@ouestware/atoms";

import { sessionAtom } from "./atom";
import { Session } from "./types";
import { getEmptySession } from "./utils";

const reset: Producer<Session, []> = () => {
  return () => getEmptySession();
};

const setLastLayout: Producer<Session, [Session["lastLayout"]]> = (layoutId) => {
  return (session) => ({
    ...session,
    lastLayout: layoutId,
  });
};

export const sessionActions = {
  reset: producerToAction(reset, sessionAtom),
  setLastLayout: producerToAction(setLastLayout, sessionAtom),
};
