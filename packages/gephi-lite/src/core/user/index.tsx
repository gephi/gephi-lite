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
  if (!isNil(user)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userData: any = { ...user };
    // Only include provider if it exists and can be serialized
    if (user.provider) {
      userData.provider = user.provider.serialize();
    }
    localStorage.setItem(LS_USER_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(LS_USER_KEY);
  }
});
