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

      // Use header toast UI if available
      const header = document.querySelector('dataviz-tool-header') as HTMLElement & { showMessage?: (message: string, type: string) => void };
      if (header?.showMessage) {
        // Map notification type to toast type
        let toastType: 'success' | 'error' | 'info' = 'info';
        if (notif.type === 'success') toastType = 'success';
        else if (notif.type === 'error') toastType = 'error';

        // Combine title and message
        const message = notif.title
          ? `${notif.title}: ${notif.message}`
          : String(notif.message);

        header.showMessage(message, toastType);
      } else {
        // Fallback to atom-based notification system
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
