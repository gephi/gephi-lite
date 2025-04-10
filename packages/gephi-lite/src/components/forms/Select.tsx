import type { LegacyRef } from "react";
import ReactSelect, { Props as ReactSelectProps, type SelectInstance } from "react-select";

export const DEFAULT_SELECT_PROPS = {
  classNamePrefix: "react-select",
  menuPosition: "fixed" as ReactSelectProps["menuPosition"],
};

export interface DefaultOption {
  value: string;
  label: string | JSX.Element;
}

export function Select<T = DefaultOption, IsMulti extends boolean = false>({
  ref,
  ...props
}: ReactSelectProps<T, IsMulti> & { ref?: LegacyRef<SelectInstance<T, IsMulti>> }) {
  return (
    <ReactSelect<T, IsMulti>
      {...DEFAULT_SELECT_PROPS}
      {...props}
      components={{
        IndicatorSeparator: null,
      }}
      ref={ref}
    />
  );
}
