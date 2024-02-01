import cx from "classnames";
import { FC, Fragment } from "react";

/**
 * This toggle button displays and controls a boolean value, with two "left" and
 * "right" labels:
 *   - `true` is right
 *   - `false` is left
 */
export const Toggle: FC<{
  value: boolean;
  onChange: (newValue: boolean) => void;
  leftLabel: JSX.Element | string;
  rightLabel: JSX.Element | string;
  className?: string;
  disabled?: boolean;
}> = ({ value, onChange, leftLabel, rightLabel, className, disabled }) => {
  return (
    <div className={cx("text-nowrap form-switch d-flex align-items-center ps-0", className)}>
      <button
        className={cx("btn btn-sm", value ? "btn-outline-dark" : "btn-dark")}
        onClick={() => {
          onChange(false);
        }}
        disabled={disabled}
      >
        {leftLabel}
      </button>

      <input
        type="checkbox"
        role="switch"
        className="form-check-input d-inline-block position-relative mx-2 cursor-pointer"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />

      <button
        className={cx("btn btn-sm", !value ? "btn-outline-dark" : "btn-dark")}
        onClick={() => {
          onChange(true);
        }}
        disabled={disabled}
      >
        {rightLabel}
      </button>
    </div>
  );
};

export function ToggleBar<T>(props: {
  value: T;
  options: Array<{ label: JSX.Element | string; value: T }>;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}) {
  const { value, onChange, options, className, disabled } = props;
  return (
    <ul className={cx("nav nav-tabs", className)}>
      {options.map((option) => (
        <Fragment key={`${option.value}`}>
          <li className="nav-item">
            <button
              className={cx("nav-link link-dark", className, option.value === value && "active")}
              onClick={() => onChange(option.value)}
              disabled={disabled}
            >
              {option.label}
            </button>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
