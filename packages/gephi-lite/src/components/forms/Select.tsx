import { isNil } from "lodash";
import { LegacyRef, ReactNode } from "react";
import { PiCaretDown } from "react-icons/pi";
import ReactSelect, { Props, type SelectInstance } from "react-select";
import AsyncReactSelect, { AsyncProps } from "react-select/async";
import AsyncCreatableReactSelect, { AsyncCreatableProps } from "react-select/async-creatable";
import CreatableReactSelect, { CreatableProps } from "react-select/creatable";
import { GroupBase } from "react-select/dist/declarations/src/types";

export const DEFAULT_SELECT_PROPS = {
  classNamePrefix: "react-select",
  menuPosition: "fixed" as Props["menuPosition"],
  components: {
    IndicatorSeparator: null,
    DropdownIndicator: () => <PiCaretDown />,
  },
};

export interface BaseOption<T extends string = string> {
  value: T;
  label: ReactNode;
}

export function optionize(value: undefined): undefined;
export function optionize<T extends string = string>(value: T): BaseOption<T>;
export function optionize<T extends string = string>(value?: T): BaseOption<T> | undefined {
  return !isNil(value) ? { value, label: value } : undefined;
}

export function Select<T = BaseOption, IsMulti extends boolean = false>({
  ref,
  ...props
}: Props<T, IsMulti> & { ref?: LegacyRef<SelectInstance<T, IsMulti>> }) {
  return (
    <ReactSelect<T, IsMulti>
      {...DEFAULT_SELECT_PROPS}
      {...props}
      components={{
        ...DEFAULT_SELECT_PROPS.components,
        ...(props.components || {}),
      }}
      ref={ref}
    />
  );
}

export function AsyncSelect<T = BaseOption, IsMulti extends boolean = false>({
  ref,
  ...props
}: AsyncProps<T, IsMulti, GroupBase<T>> & { ref?: LegacyRef<SelectInstance<T, IsMulti>> }) {
  return (
    <AsyncReactSelect<T, IsMulti>
      {...DEFAULT_SELECT_PROPS}
      {...props}
      components={{
        ...DEFAULT_SELECT_PROPS.components,
        ...(props.components || {}),
      }}
      ref={ref}
    />
  );
}

export function CreatableSelect<T = BaseOption, IsMulti extends boolean = false>({
  ref,
  ...props
}: CreatableProps<T, IsMulti, GroupBase<T>> & { ref?: LegacyRef<SelectInstance<T, IsMulti>> }) {
  return (
    <CreatableReactSelect<T, IsMulti>
      {...DEFAULT_SELECT_PROPS}
      {...props}
      components={{
        ...DEFAULT_SELECT_PROPS.components,
        ...(props.components || {}),
      }}
      ref={ref}
    />
  );
}

export function AsyncCreatableSelect<T = BaseOption, IsMulti extends boolean = false>({
  ref,
  ...props
}: AsyncCreatableProps<T, IsMulti, GroupBase<T>> & { ref?: LegacyRef<SelectInstance<T, IsMulti>> }) {
  return (
    <AsyncCreatableReactSelect<T, IsMulti>
      {...DEFAULT_SELECT_PROPS}
      {...props}
      components={{
        ...DEFAULT_SELECT_PROPS.components,
        ...(props.components || {}),
      }}
      ref={ref}
    />
  );
}
