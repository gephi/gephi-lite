import { User } from "./types";
import { atom, useAtom } from "../utils/atoms";

export const userAtom = atom<User | null>(null);

export function useConnectedUser() {
  return useAtom(userAtom);
}
