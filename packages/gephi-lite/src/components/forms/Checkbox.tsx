import { isNil, noop } from "lodash";
import { FC, InputHTMLAttributes, useEffect, useRef } from "react";

export const Checkbox: FC<Omit<InputHTMLAttributes<HTMLInputElement>, "checked" | "type"> & { checked?: boolean }> = ({
  checked,
  onChange = noop,
  ...props
}) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = isNil(checked);
  }, [checked]);

  return <input {...props} type="checkbox" checked={checked} ref={ref} onChange={onChange} />;
};
