import { isNil } from "lodash";
import { KeyboardEvent, LegacyRef, ReactNode, useContext, useState } from "react";
import ReactSelect, { Props, type SelectInstance } from "react-select";
import AsyncReactSelect, { AsyncProps } from "react-select/async";
import AsyncCreatableReactSelect, { AsyncCreatableProps } from "react-select/async-creatable";
import CreatableReactSelect, { CreatableProps } from "react-select/creatable";
import { GroupBase } from "react-select/dist/declarations/src/types";

import { UIContext } from "../../core/context/uiContext";
import { CaretDownIcon } from "../common-icons";

// `menuIsOpen` is kept controlled here (so Escape can be swallowed while the menu is open, see
// onKeyDown below), which means react-select's own `defaultMenuIsOpen` would be ignored. Seed the
// initial state from it instead, so that prop keeps its standard meaning for our callers.
const useDefaultSelectProps = (defaultMenuIsOpen?: boolean) => {
  const [isMenuOpen, setIsMenuOpen] = useState(!!defaultMenuIsOpen);

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

export interface BaseOption<V> {
  value: V;
  label: ReactNode;
}

export type StringOption = BaseOption<string>;

export function optionize(value: undefined): undefined;
export function optionize<V>(value: V): BaseOption<V>;
export function optionize<V>(value?: V): BaseOption<V> | undefined {
  return !isNil(value) ? { value, label: value + "" } : undefined;
}

export function Select<BO, IsMulti extends boolean = false>({
  ref,
  ...props
}: Props<BO, IsMulti> & { ref?: LegacyRef<SelectInstance<BO, IsMulti>> }) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen);
  return (
    <ReactSelect<BO, IsMulti>
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

export function AsyncSelect<BO, IsMulti extends boolean = false>({
  ref,
  ...props
}: AsyncProps<BO, IsMulti, GroupBase<BO>> & { ref?: LegacyRef<SelectInstance<BO, IsMulti>> }) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen);
  return (
    <AsyncReactSelect<BO, IsMulti>
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

export function CreatableSelect<BO, IsMulti extends boolean = false>({
  ref,
  ...props
}: CreatableProps<BO, IsMulti, GroupBase<BO>> & { ref?: LegacyRef<SelectInstance<BO, IsMulti>> }) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen);
  return (
    <CreatableReactSelect<BO, IsMulti>
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

export function AsyncCreatableSelect<BO, IsMulti extends boolean = false>({
  ref,
  ...props
}: AsyncCreatableProps<BO, IsMulti, GroupBase<BO>> & { ref?: LegacyRef<SelectInstance<BO, IsMulti>> }) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen);
  return (
    <AsyncCreatableReactSelect<BO, IsMulti>
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
