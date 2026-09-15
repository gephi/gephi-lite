import { Producer, producerToAction } from "@ouestware/atoms";

import { userAtom } from "./atom";
import { UserState } from "./types";

const logout: Producer<UserState> = () => {
  return () => null;
};

const login: Producer<UserState, [UserState]> = (user) => {
  return () => user;
};

export const userActions = {
  logout: producerToAction(logout, userAtom),
  login: producerToAction(login, userAtom),
};
