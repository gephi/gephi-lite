import cx from "classnames";
import Select from "react-select";
import { FC, InputHTMLAttributes } from "react";

interface BaseTypedInputProps {
  id: string;
  label: string;
  description?: string;
}

export const NumberInput: FC<
  { value: number | null; onChange: (v: number) => void } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, ...attrs }) => {
  return (
    <div className="mt-1">
      <label htmlFor={id} className="form-check-label small">
        {label}
      </label>
      <input
        {...attrs}
        type="number"
        className={cx("form-control form-control-sm", className)}
        id={id}
        value={value || ""}
        onChange={(e) => onChange(+e.target.value)}
      />
      {description && <div className="form-text small text-muted">{description}</div>}
    </div>
  );
};

export const StringInput: FC<
  { value: string | null; onChange: (v: string) => void } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, ...attrs }) => {
  return (
    <div className="mt-1">
      <label htmlFor={id} className="form-check-label small ms-1">
        {label}
      </label>
      <input
        {...attrs}
        type="string"
        className={cx("form-control form-control-sm", className)}
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      {description && <div className="form-text small text-muted">{description}</div>}
    </div>
  );
};

export const BooleanInput: FC<
  { value: boolean | null; onChange: (v: boolean) => void } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, ...attrs }) => {
  return (
    <>
      <div className="form-check mt-1">
        <input
          {...attrs}
          type="checkbox"
          className={cx("form-check-input", className)}
          id={id}
          checked={value ?? false}
          onChange={(e) => onChange(!!e.target.checked)}
        />
        <label htmlFor={id} className="form-check-label small ms-1">
          {label}
        </label>
      </div>
      {description && <div className="form-text small text-muted">{description}</div>}
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
  } & BaseTypedInputProps
> = ({ id, label, description, required, value, options, onChange, className, placeholder }) => {
  const option = options.find((o) => o.value === value);

  return (
    <>
      <div className="mt-1">
        <label htmlFor={id} className="form-check-label small">
          {label}
        </label>
        <Select<EnumOption>
          className={className}
          placeholder={placeholder}
          value={option}
          options={options}
          onChange={(o) => onChange(o?.value || null)}
        />
      </div>
      {description && <div className="form-text small text-muted">{description}</div>}
    </>
  );
};
