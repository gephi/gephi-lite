import { isNil } from "lodash";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { localStorage } from "../../utils/storage";
import { ghProviderDeserialize } from "../cloud/github/provider";
import { useNotifications } from "../notifications";
import { userActions } from "./actions";

export const LS_USER_KEY = "user";

/**
 * Sync user saved in localstorage with the atom.
 * Used when the application is loaded.
 */
export const AuthInit: FC = () => {
  const { t } = useTranslation();
  const { notify } = useNotifications();

  useEffect(() => {
    const lsUserString = localStorage.getItem(LS_USER_KEY);
    if (!isNil(lsUserString)) {
      try {
        const lsUser = JSON.parse(lsUserString);
        // TODO: need to check the validity of the user
        // before to set it and also to find a better way to deserialize provider
        userActions.login({ ...lsUser, provider: ghProviderDeserialize(lsUser.provider) });
      } catch (e) {
        console.error("Failed to load user from localstorage", e);
        notify({
          type: "warning",
          title: `${t("gephi-lite.title")}`,
          message: "TODO",
        });
        userActions.logout();
      }
    }
  }, [notify, t]);

  return null;
};
