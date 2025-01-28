import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useNotifications } from "../notifications";
import { BroadcastClient } from "./client";

export function useBroadcast(broadcastID?: string | null) {
  const { t } = useTranslation();
  const { notify } = useNotifications();

  useEffect(() => {
    if (!broadcastID) return;

    const client = new BroadcastClient(broadcastID);
    client.broadcastEvent("newInstance");

    return () => {
      client.destroy();
    };
  }, [broadcastID, notify, t]);
}
