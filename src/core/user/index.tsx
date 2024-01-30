import { isNil } from "lodash";

import { atom, useAtom } from "../utils/atoms";
import { User } from "./types";

export const LS_USER_KEY = "user";
export const userAtom = atom<User | null>(null);

export function useConnectedUser() {
  return useAtom(userAtom);
}

/**
 * Sync. user atom in the localstorage
 */
userAtom.bind((user) => {
  if (!isNil(user)) localStorage.setItem(LS_USER_KEY, JSON.stringify({ ...user, provider: user.provider.serialize() }));
  else localStorage.removeItem(LS_USER_KEY);
});
