import { useCallback } from "react";

import { Notification } from "./types";
import { useAppContext } from "../../hooks/useAppContext";

let INCREMENTAL_ID = 1;
export function useNotifications() {
  const [, setContext] = useAppContext();

  const notify = useCallback(
    (notif: Notification) => {
      const id = ++INCREMENTAL_ID;
      setContext((prev) => ({
        ...prev,
        notifications: [{ id, createdAt: new Date(), ...notif }, ...prev.notifications],
      }));
    },
    [setContext],
  );

  return { notify };
}
