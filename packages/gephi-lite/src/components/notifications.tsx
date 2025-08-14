import { useAtom } from "@ouestware/atoms";
import cx from "classnames";
import { FC, useCallback, useState } from "react";

import { config } from "../config";
import { notificationsStateAtom } from "../core/notifications";
import { NotificationType } from "../core/notifications/types";
import { useTimeout } from "../hooks/useTimeout";
import { dateToFromAgo } from "../utils/date";
import { STATUS_ICONS } from "./common-icons";

export const Notifications: FC = () => {
  const [{ notifications }, setNotificationsState] = useAtom(notificationsStateAtom);

  const close = useCallback(
    (id: number) =>
      setNotificationsState((state) => ({
        ...state,
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    [setNotificationsState],
  );

  return (
    <div className="toasts-container" style={{ zIndex: 1056, left: "auto", maxWidth: "50%" }}>
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} onClose={() => close(notification.id)} />
      ))}
    </div>
  );
};

const CLASSES_TOAST = {
  success: "",
  info: "",
  warning: "",
  error: "",
};

const Notification: FC<{
  notification: NotificationType;
  onClose?: () => void;
}> = ({ notification, onClose }) => {
  const [show, setShow] = useState<boolean>(true);
  const IconComponent = STATUS_ICONS[notification.type];

  const close = useCallback(() => {
    setShow(false);
    if (onClose) onClose();
  }, [setShow, onClose]);

  const { cancel, reschedule } = useTimeout(close, config.notificationTimeoutMs);

  return (
    <div
      className={cx("toast fade", show ? "show" : "hide", CLASSES_TOAST[notification.type])}
      onMouseEnter={cancel}
      onMouseLeave={reschedule}
    >
      <div className="toast-header">
        <IconComponent className={cx(`text-${notification.type}`)} />
        <strong className="ms-2 me-auto">{notification.title || notification.type}</strong>
        {notification.createdAt && <small className="text-end">{dateToFromAgo(notification.createdAt)}</small>}

        <button type="button" className="btn-close" onClick={() => close()}></button>
      </div>

      <div className="toast-body">{notification.message}</div>
    </div>
  );
};

export default Notifications;
