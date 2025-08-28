import cx from "classnames";
import { clamp } from "lodash";
import Slider from "rc-slider";
import { MarkObj } from "rc-slider/lib/Marks";
import { SliderProps } from "rc-slider/lib/Slider";
import React, { FC, InputHTMLAttributes, ReactNode, useMemo } from "react";

import MessageTooltip from "../MessageTooltip";
import { Select } from "./Select";

interface BaseTypedInputProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
}

export const SLIDER_STYLE = {
  dotStyle: { borderColor: "#ccc" },
  railStyle: { backgroundColor: "#ccc" },
  activeDotStyle: { borderColor: "black" },
  trackStyle: { backgroundColor: "black" },
  handleStyle: { backgroundColor: "white", borderColor: "black" },
};

export const NumberInput: FC<
  { value: number | null; onChange: (v: number | null) => void } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, defaultValue, ...attrs }) => {
  return (
    <>
      <div className="d-flex gl-gap-1 align-items-center">
        <label htmlFor={id} className="form-check-label">
          {label}
        </label>
        {description && <MessageTooltip message={description} />}
      </div>
      <input
        step="any"
        {...attrs}
        type="number"
        className={cx("form-control form-control-sm", className)}
        id={id}
        value={typeof value === "number" ? value : defaultValue || ""}
        onChange={(e) => onChange(isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber)}
      />
    </>
  );
};

export const SliderInput: FC<
  {
    id?: string;
    value: number | null;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    marks?: Record<string | number, React.ReactNode | MarkObj>;
  } & Omit<BaseTypedInputProps, "id">
> = ({ id, label, description, value, onChange, min, max, marks, step }) => {
  const validMin = useMemo(() => Math.min(min, max), [min, max]);
  const validMax = useMemo(() => Math.max(min, max), [min, max]);
  const validValue = useMemo(() => {
    if (typeof value !== "number") return validMin;
    return clamp(value, validMin, validMax);
  }, [value, validMin, validMax]);

  return (
    <>
      <div className="d-flex gl-gap-1 align-items-center">
        <label htmlFor={id} className="form-check-label">
          {label}
        </label>
        {description && <MessageTooltip message={description} />}
      </div>
      <div className="pb-3">
        <Slider
          id={id}
          value={validValue}
          min={validMin}
          max={validMax}
          step={step}
          marks={
            marks || {
              [validMin]: validMin,
              [validMax]: validMax,
              [validValue]: validValue,
            }
          }
          onChange={
            ((v: number) => {
              onChange(v);
            }) as SliderProps["onChange"]
          }
          // Styles:
          {...SLIDER_STYLE}
        />
      </div>
    </>
  );
};

export const StringInput: FC<
  { value: string | null; onChange: (v: string) => void; warning?: string } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, warning, ...attrs }) => {
  return (
    <>
      <div className="d-flex gl-gap-1 align-items-center">
        <label htmlFor={id} className="form-check-label">
          {label}
        </label>
        {description && <MessageTooltip message={description} />}
      </div>
      <div className="position-relative">
        <input
          {...attrs}
          type="string"
          className={cx("form-control form-control-sm", className)}
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {warning && (
          <MessageTooltip
            message={warning}
            type="warning"
            className="position-absolute end-0 top-0 h-100 me-2 d-flex align-items-center"
            iconClassName="fs-4"
          />
        )}
      </div>
    </>
  );
};

export const BooleanInput: FC<
  { value: boolean | null; onChange: (v: boolean) => void } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, ...attrs }) => {
  return (
    <>
      <div className="form-check">
        <input
          {...attrs}
          type="checkbox"
          className={cx("form-check-input", className)}
          id={id}
          defaultChecked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="d-flex gl-gap-1 align-items-center">
          <label htmlFor={id} className="form-check-label">
            {label}
          </label>
          {description && <MessageTooltip message={description} />}
        </div>
      </div>
    </>
  );
};

export interface EnumOption {
  value: string;
  label: string | JSX.Element;
}
export const EnumInput: FC<
  {
    value: string | null;
    options: EnumOption[];
    onChange: (v: string | null) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
  } & BaseTypedInputProps
> = ({ id, label, description, required, disabled, value, options, onChange, className, placeholder }) => {
  const option = options.find((o) => o.value === value);

  return (
    <>
      <div className="d-flex gl-gap-1 align-items-center">
        <label htmlFor={id} className="form-check-label">
          {label}
        </label>
        {description && <MessageTooltip message={description} />}
      </div>
      <Select<EnumOption>
        isDisabled={disabled}
        isClearable={!required}
        className={cx("form-control-sm", className)}
        placeholder={placeholder}
        value={option || null}
        options={options}
        onChange={(o) => onChange(o?.value || null)}
      />
    </>
  );
};
