import { isNil } from "lodash";
import { KeyboardEvent, LegacyRef, ReactNode, useContext, useState } from "react";
import ReactSelect, { Props, type SelectInstance } from "react-select";
import AsyncReactSelect, { AsyncProps } from "react-select/async";
import AsyncCreatableReactSelect, { AsyncCreatableProps } from "react-select/async-creatable";
import CreatableReactSelect, { CreatableProps } from "react-select/creatable";
import { GroupBase } from "react-select/dist/declarations/src/types";

import { UIContext } from "../../core/context/uiContext";
import { CaretDownIcon } from "../common-icons";

const useDefaultSelectProps = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return {
    classNamePrefix: "react-select",
    menuPosition: "fixed" as Props["menuPosition"],
    components: {
      IndicatorSeparator: null,
      DropdownIndicator: () => <CaretDownIcon />,
    },
    onMenuOpen: () => setIsMenuOpen(true),
    onMenuClose: () => setIsMenuOpen(false),
    menuIsOpen: isMenuOpen,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) event.stopPropagation();
    },
  };
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
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps();
  return (
    <ReactSelect<T, IsMulti>
      menuPortalTarget={portalTarget}
      {...defaultProps}
      {...props}
      components={{
        ...defaultProps.components,
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
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps();
  return (
    <AsyncReactSelect<T, IsMulti>
      menuPortalTarget={portalTarget}
      {...defaultProps}
      {...props}
      components={{
        ...defaultProps.components,
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
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps();
  return (
    <CreatableReactSelect<T, IsMulti>
      menuPortalTarget={portalTarget}
      {...defaultProps}
      {...props}
      components={{
        ...defaultProps.components,
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
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps();
  return (
    <AsyncCreatableReactSelect<T, IsMulti>
      menuPortalTarget={portalTarget}
      {...defaultProps}
      {...props}
      components={{
        ...defaultProps.components,
        ...(props.components || {}),
      }}
      ref={ref}
    />
  );
}
