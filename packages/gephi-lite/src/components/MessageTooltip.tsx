import cx from "classnames";
import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import { IconType } from "react-icons";

import Tooltip, { TooltipAPI } from "./Tooltip";
import { STATUS_ICONS } from "./common-icons";

type MessageType = keyof typeof STATUS_ICONS;

const MessageTooltip: FC<{
  message: ReactNode;
  type?: MessageType;
  icon?: IconType;
  openOnMount?: number;
  className?: string;
  iconClassName?: string;
}> = ({ message, type = "info", icon: IconComponent = STATUS_ICONS[type], openOnMount, className, iconClassName }) => {
  const tooltipRef = useRef<TooltipAPI>(null);
  const [timeout, setTimeout] = useState<null | number>(null);

  useEffect(() => {
    let timeoutID: number | undefined;
    if (tooltipRef.current && openOnMount && !tooltipRef.current.isOpened()) {
      tooltipRef.current.open();
      timeoutID = window.setTimeout(() => {
        tooltipRef.current?.close();
      }, openOnMount);

      setTimeout(timeoutID);
    }

    return () => {
      if (timeoutID) window.clearTimeout(timeoutID);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip
      ref={tooltipRef}
      hoverable
      attachment="bottom middle"
      targetAttachment="top middle"
      targetClassName={className}
    >
      <button
        type="button"
        className="gl-btn gt-btn-icon p-0 text"
        onMouseEnter={() => {
          if (timeout) window.clearTimeout(timeout);
        }}
      >
        <IconComponent className={cx(iconClassName)} />
      </button>
      <div
        className="tooltip show bs-tooltip-top p-0 mx-2"
        role="tooltip"
        onMouseEnter={() => {
          if (timeout) window.clearTimeout(timeout);
        }}
      >
        <div className={cx("tooltip-inner", `gl-tooltip`)}>{message}</div>
      </div>
    </Tooltip>
  );
};

export default MessageTooltip;
