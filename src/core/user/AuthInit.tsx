import { FC, useEffect } from "react";
import { isNil } from "lodash";

import { useConnectedUser, LS_USER_KEY } from "./index";
import { ghProviderDeserialize } from "../cloud/github/provider";

/**
 * Sync user saved in localstorage with the atom.
 * Used when the application is loaded.
 */
export const AuthInit: FC = () => {
  const [, setUser] = useConnectedUser();

  useEffect(() => {
    const lsUserString = localStorage.getItem(LS_USER_KEY);
    if (!isNil(lsUserString)) {
      try {
        const lsUser = JSON.parse(lsUserString);
        // TODO: need to check the validity of the user
        // before to set it and also to find a better way to deserialize provider
        setUser({ ...lsUser, provider: ghProviderDeserialize(lsUser.provider) });
      } catch (e) {
        console.error("Failed to load user from localstorage", e);
        setUser(null);
      }
    }
  }, [setUser]);

  return null;
};
