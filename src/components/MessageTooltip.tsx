import cx from "classnames";
import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import { IconType } from "react-icons";
import { AiFillWarning, AiOutlineCheckCircle, AiOutlineInfoCircle } from "react-icons/ai";

import Tooltip, { TooltipAPI } from "./Tooltip";

const DEFAULT_ICONS = {
  success: AiOutlineCheckCircle,
  info: AiOutlineInfoCircle,
  warning: AiFillWarning,
  error: AiFillWarning,
} as const;
type MessageType = keyof typeof DEFAULT_ICONS;

const MessageTooltip: FC<{
  message: ReactNode;
  type?: MessageType;
  icon?: IconType;
  openOnMount?: number;
  className?: string;
  iconClassName?: string;
}> = ({ message, type = "info", icon: IconComponent = DEFAULT_ICONS[type], openOnMount, className, iconClassName }) => {
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
    <Tooltip ref={tooltipRef} attachment="top middle" targetAttachment="bottom middle" targetClassName={className}>
      <button
        type="button"
        className="btn p-0 text"
        onMouseEnter={() => {
          if (timeout) window.clearTimeout(timeout);
        }}
      >
        <IconComponent className={cx(`text-${type}`, iconClassName)} />
      </button>
      <div
        className="tooltip show bs-tooltip-top p-0 mx-2"
        role="tooltip"
        onMouseEnter={() => {
          if (timeout) window.clearTimeout(timeout);
        }}
      >
        <div className={cx("tooltip-inner", `bg-${type} text-bg-${type}`)}>{message}</div>
      </div>
    </Tooltip>
  );
};

export default MessageTooltip;
