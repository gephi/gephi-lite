import { isNil } from "lodash";

import { localStorage } from "../../utils/storage";
import { userAtom } from "./atom";

export const LS_USER_KEY = "user";

/**
 * Sync. user atom in the localstorage
 */
userAtom.bind((user) => {
  if (!isNil(user)) localStorage.setItem(LS_USER_KEY, JSON.stringify({ ...user, provider: user.provider.serialize() }));
  else localStorage.removeItem(LS_USER_KEY);
});
