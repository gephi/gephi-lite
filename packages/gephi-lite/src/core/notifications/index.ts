import { atom, useWriteAtom } from "@ouestware/atoms";
import { useCallback } from "react";

import { NotificationData, NotificationsState } from "./types";

export const notificationsStateAtom = atom<NotificationsState>({ notifications: [] });

let INCREMENTAL_ID = 1;
export function useNotifications() {
  const setNotificationsState = useWriteAtom(notificationsStateAtom);

  const notify = useCallback(
    (notif: NotificationData) => {
      const id = ++INCREMENTAL_ID;
      setNotificationsState((state) => ({
        ...state,
        notifications: [{ id, createdAt: new Date(), ...notif }, ...state.notifications],
      }));
    },
    [setNotificationsState],
  );

  return { notify };
}
