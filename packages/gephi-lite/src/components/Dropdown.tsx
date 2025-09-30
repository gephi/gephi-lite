import cx from "classnames";
import { FC, Fragment, ReactNode } from "react";

import Tooltip from "./Tooltip";

type OptionCommon = {
  type?: "option";
  label: ReactNode;
  title?: string;
  disabled?: boolean;
};

type DropdownSide = "left" | "right";
type OptionLink = OptionCommon & { url: string };
type OptionAction = OptionCommon & { onClick: () => void | Promise<void> };
type OptionText = Omit<OptionCommon, "type"> & { type: "text" };
type OptionDivider = { type: "divider" };
export type Option = OptionLink | OptionAction | OptionText | OptionDivider;

const Dropdown: FC<{ children: ReactNode; options: Option[]; side?: DropdownSide; className?: string }> = ({
  children: target,
  options,
  className,
  side = "left",
}) => {
  return (
    <Tooltip
      hoverable
      closeOnClickContent
      attachment={`top ${side}`}
      targetAttachment={`bottom ${side}`}
      targetClassName={className}
    >
      {target}
      <div className="dropdown-menu show over-modal position-relative gl-menu">
        {options.map((option, i) => (
          <Fragment key={i}>
            {option.type === "divider" && <div className="dropdown-divider gl-menu-divider" />}
            {option.type === "text" && <div className="dropdown-item-text">{option.label}</div>}
            {"url" in option && (
              <a
                className={cx("dropdown-item gl-menu-item", option.disabled && "disabled")}
                href={option.url}
                title={option.title}
                target="_blank"
                rel="noopener noreferrer"
              >
                {option.label}
              </a>
            )}
            {"onClick" in option && (
              <button
                className={cx("dropdown-item gl-menu-item", option.disabled && "disabled")}
                title={option.title}
                disabled={option.disabled}
                onClick={option.onClick}
              >
                {option.label}
              </button>
            )}
          </Fragment>
        ))}
      </div>
    </Tooltip>
  );
};

export default Dropdown;
