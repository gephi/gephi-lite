import cx from "classnames";
import React, { FC, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CloseIcon, STATUS_ICONS } from "./common-icons";

type MessageType = keyof typeof STATUS_ICONS;

const MessageAlert: FC<{
  message: ReactNode;
  type?: MessageType;
  className?: string;
}> = ({ message, type = "info", className }) => {
  const [open, setOpen] = useState(true);
  const [timeout, setTimeout] = useState<null | number>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const timeoutID = window.setTimeout(() => {
      setOpen(false);
    }, 3000);
    setTimeout(timeoutID);

    return () => {
      if (timeoutID) window.clearTimeout(timeoutID);
    };
  }, []);

  return (
    <>
      {open ? (
        <div
          className={cx("alert gl-m-0", `gl-alert-${type} position-relative`, className)}
          role="alert"
          onMouseEnter={() => {
            if (timeout) window.clearTimeout(timeout);
          }}
        >
          <button
            type="button"
            title={t("common.close").toString()}
            className="gl-btn gl-btn-icon gl-btn-close "
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </button>
          {message}
        </div>
      ) : null}
    </>
  );
};

export default MessageAlert;
