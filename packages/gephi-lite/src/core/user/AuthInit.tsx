import { isNil } from "lodash";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ghProviderDeserialize } from "../cloud/github/provider";
import { useNotifications } from "../notifications";
import { LS_USER_KEY, useConnectedUser } from "./index";

/**
 * Sync user saved in localstorage with the atom.
 * Used when the application is loaded.
 */
export const AuthInit: FC = () => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const [, setUser] = useConnectedUser();

  useEffect(() => {
    const lsUserString = localStorage.getItem(LS_USER_KEY);
    if (!isNil(lsUserString)) {
      try {
        const lsUser = JSON.parse(lsUserString);
        let provider;
        // Only deserialize provider if it exists in localStorage
        if (lsUser.provider) {
          const providerData = JSON.parse(lsUser.provider);
          // Dataviz provider is no longer managed here (handled by dataviz-tool-header API)
          if (providerData.type === "dataviz") {
            // Skip provider for dataviz users
            provider = undefined;
          } else {
            provider = ghProviderDeserialize(lsUser.provider);
          }
        }
        setUser({ ...lsUser, provider });
      } catch (e) {
        console.error("Failed to load user from localstorage:", e);
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error("Error details:", errorMsg);
        // TODO: Show user-friendly error message, but for now suppress the warning
        // to avoid showing "TODO" message on page load
        setUser(null);
      }
    }
  }, [setUser, notify, t]);

  return null;
};
