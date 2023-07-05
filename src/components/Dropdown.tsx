import { FC, ReactNode } from "react";
import cx from "classnames";

import Tooltip from "./Tooltip";

export type Option =
  | {
      type?: "option";
      label: ReactNode;
      title?: ReactNode;
      onClick: () => void;
      disabled?: boolean;
    }
  | { type: "divider" };

const Dropdown: FC<{ children: ReactNode; options: Option[] }> = ({ children: target, options }) => {
  return (
    <Tooltip hoverable closeOnClickContent>
      {target}
      <div className="dropdown-menu show over-modal position-relative">
        {options.map((option, i) =>
          option.type === "divider" ? (
            <div className="dropdown-divider" key={i} />
          ) : (
            <button
              key={i}
              className={cx("dropdown-item", option.disabled && "disabled")}
              onClick={(e) => {
                option.onClick();
              }}
            >
              {option.label}
            </button>
          ),
        )}
      </div>
    </Tooltip>
  );
};

export default Dropdown;
