import cx from "classnames";
import { FC, Fragment, ReactNode } from "react";

import Tooltip from "./Tooltip";

type OptionCommon = {
  type?: "option";
  label: ReactNode;
  title?: string;
  disabled?: boolean;
};

type OptionLink = OptionCommon & { url: string };
type OptionAction = OptionCommon & { onClick: () => void | Promise<void> };
type OptionDivider = { type: "divider" };
export type Option = OptionLink | OptionAction | OptionDivider;

const Dropdown: FC<{ children: ReactNode; options: Option[] }> = ({ children: target, options }) => {
  return (
    <Tooltip hoverable closeOnClickContent>
      {target}
      <div className="dropdown-menu show over-modal position-relative">
        {options.map((option, i) => (
          <Fragment key={i}>
            {option.type === "divider" && <div className="dropdown-divider" />}
            {"url" in option && (
              <a
                className={cx("dropdown-item", option.disabled && "disabled")}
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
                className={cx("dropdown-item", option.disabled && "disabled")}
                title={option.title}
                disabled={option.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  option.onClick();
                }}
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
