import { GephiLiteEvents } from "@gephi/gephi-lite-broadcast";
import { useEffect, useState } from "react";

import { useNotifications } from "../notifications";
import { BroadcastClient } from "./client";

export function useBroadcast(broadcastID?: string | null) {
  const { notify } = useNotifications();
  const [client, setClient] = useState<BroadcastClient | null>(null);

  /**
   * Broadcast client lifecycle:
   */
  useEffect(() => {
    if (!broadcastID) return;

    const client = new BroadcastClient(broadcastID);
    client.broadcastEvent("newInstance");
    setClient(client);

    return () => {
      client.destroy();
      setClient(null);
    };
  }, [broadcastID, notify]);

  /**
   * Events:
   */
  useEffect(() => {
    if (!client) return;

    const _handlers: Omit<GephiLiteEvents, "newInstance"> = {
      // TODO
    };
    // TODO: Bind handlers

    return () => {
      // TODO: Unbind handlers
    };
  });
}
