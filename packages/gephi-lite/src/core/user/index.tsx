import { Producer, atom, producerToAction, useAtom } from "@ouestware/atoms";
import { isNil } from "lodash";

import { User } from "./types";

export const LS_USER_KEY = "user";
type UserState = User | null;

export function useConnectedUser() {
  return useAtom(userAtom);
}

export const reset: Producer<UserState> = () => {
  return () => null;
};

/**
 * Public API:
 * ***********
 */
export const userAtom = atom<UserState>(null);

export const userActions = {
  reset: producerToAction(reset, userAtom),
};

/**
 * Sync. user atom in the localstorage
 */
userAtom.bind((user) => {
  if (!isNil(user)) localStorage.setItem(LS_USER_KEY, JSON.stringify({ ...user, provider: user.provider.serialize() }));
  else localStorage.removeItem(LS_USER_KEY);
});
