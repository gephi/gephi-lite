import { atom, useWriteAtom } from "@ouestware/atoms";
import { useCallback } from "react";

import { type ToolHeaderToastType, showToolHeaderMessage } from "../toolHeader";
import { NotificationData, NotificationsState } from "./types";

export const notificationsStateAtom = atom<NotificationsState>({ notifications: [] });

let INCREMENTAL_ID = 1;
export function useNotifications() {
  const setNotificationsState = useWriteAtom(notificationsStateAtom);

  const notify = useCallback(
    (notif: NotificationData) => {
      const id = ++INCREMENTAL_ID;

      let toastType: ToolHeaderToastType = "info";
      if (notif.type === "success") toastType = "success";
      else if (notif.type === "error") toastType = "error";

      const message = notif.title ? `${String(notif.title)}: ${String(notif.message)}` : String(notif.message);

      if (!showToolHeaderMessage(message, toastType)) {
        setNotificationsState((state) => ({
          ...state,
          notifications: [{ id, createdAt: new Date(), ...notif }, ...state.notifications],
        }));
      }
    },
    [setNotificationsState],
  );

  return { notify };
}
