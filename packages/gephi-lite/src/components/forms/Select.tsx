import ReactSelect, { Props as ReactSelectProps } from "react-select";

export const DEFAULT_SELECT_PROPS = {
  classNamePrefix: "react-select",
  menuPosition: "fixed" as ReactSelectProps["menuPosition"],
};

export interface DefaultOption {
  value: string;
  label: string | JSX.Element;
}

export function Select<T = DefaultOption, IsMulti extends boolean = false>(props: ReactSelectProps<T, IsMulti>) {
  return (
    <ReactSelect<T, IsMulti>
      {...DEFAULT_SELECT_PROPS}
      {...props}
      components={{
        IndicatorSeparator: null,
      }}
    />
  );
}
