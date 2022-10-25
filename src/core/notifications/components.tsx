import { FC, useState, useCallback } from "react";
import cx from "classnames";
import {
  BsFillCheckCircleFill,
  BsFillInfoCircleFill,
  BsFillExclamationTriangleFill,
  BsFillExclamationOctagonFill,
} from "react-icons/bs";

import { config } from "../../config";
import { useTimeout } from "../../hooks/useTimeout";
import { useAppContext } from "../../hooks/useAppContext";
import { dateToFromAgo } from "../../utils/date";
import { NotificationState } from "./types";

export const Notifications: FC = () => {
  const [{ notifications }, setContext] = useAppContext();

  const close = useCallback(
    (id: NotificationState["id"]) =>
      setContext((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((e) => e.id !== id),
      })),
    [setContext]
  );

  return (
    <div
      className="toasts-container fixed-bottom"
      style={{ zIndex: 1056, left: "auto", maxWidth: "50%" }}
    >
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => close(notification.id)}
        />
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

const ICONS_TOAST = {
  success: <BsFillCheckCircleFill className="text-success" />,
  info: <BsFillInfoCircleFill className="text-info" />,
  warning: <BsFillExclamationTriangleFill className="text-warning" />,
  error: <BsFillExclamationOctagonFill className="text-danger" />,
};

const Notification: FC<{
  notification: NotificationState;
  onClose?: () => void;
}> = ({ notification, onClose }) => {
  const [show, setShow] = useState<boolean>(true);

  const close = useCallback(() => {
    setShow(false);
    if (onClose) onClose();
  }, [setShow, onClose]);

  const { cancel, reschedule } = useTimeout(
    close,
    config.notificationTimeoutMs
  );

  return (
    <div
      className={cx(
        "toast fade",
        show ? "show" : "hide",
        CLASSES_TOAST[notification.type]
      )}
      onMouseEnter={cancel}
      onMouseLeave={reschedule}
    >
      <div className="toast-header">
        {ICONS_TOAST[notification.type]}
        <strong className="ms-2 me-auto">
          {notification.title || notification.type}
        </strong>
        {notification.createdAt && (
          <small>{dateToFromAgo(notification.createdAt)}</small>
        )}

        <button
          type="button"
          className="btn-close"
          onClick={() => close()}
        ></button>
      </div>

      <div className="toast-body">{notification.message}</div>
    </div>
  );
};

export default Notifications;
