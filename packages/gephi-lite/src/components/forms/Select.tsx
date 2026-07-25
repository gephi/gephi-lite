import { isNil } from "lodash";
import { KeyboardEvent, ReactNode, Ref, forwardRef, useContext, useState } from "react";
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
//
// `forceMenuOpen`, when true, keeps the menu open regardless of react-select's own open/close
// triggers (blur, Escape, selecting an option...) - the normal open/close bookkeeping keeps running
// underneath, so it takes back over the moment the caller stops forcing. Used by the main fuzzy
// search box (see GraphSearch) to keep its results visible even through an involuntary blur: hiding
// a focused element via CSS (eg. collapsing a mobile panel) makes the browser blur it, which would
// otherwise close the menu until the field is clicked again.
const useDefaultSelectProps = (defaultMenuIsOpen?: boolean, forceMenuOpen?: boolean) => {
  const [isMenuOpen, setIsMenuOpen] = useState(!!defaultMenuIsOpen);
  const menuIsOpen = !!forceMenuOpen || isMenuOpen;

  return {
    classNamePrefix: "react-select",
    menuPosition: "fixed" as Props["menuPosition"],
    components: {
      IndicatorSeparator: null,
      DropdownIndicator: () => <CaretDownIcon />,
    },
    onMenuOpen: () => setIsMenuOpen(true),
    onMenuClose: () => setIsMenuOpen(false),
    menuIsOpen,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuIsOpen) event.stopPropagation();
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

// React 18 (unlike 19) never forwards a `ref` prop to a plain function component: without
// `forwardRef`, passing `ref` here would silently stay `null` forever (with a dev warning), as if
// every caller who needed the underlying select instance - eg. to blur/focus it - had no ref at
// all. `forwardRef` itself only produces a non-generic component type, so each wrapper is cast back
// to a generic function signature to keep `<BO, IsMulti>` inference working at call sites.

export const Select = forwardRef(function Select<BO, IsMulti extends boolean = false>(
  { forceMenuOpen, ...props }: Props<BO, IsMulti> & { forceMenuOpen?: boolean },
  ref: Ref<SelectInstance<BO, IsMulti>>,
) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen, forceMenuOpen);
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
}) as <BO, IsMulti extends boolean = false>(
  props: Props<BO, IsMulti> & { forceMenuOpen?: boolean; ref?: Ref<SelectInstance<BO, IsMulti>> },
) => ReturnType<typeof ReactSelect>;

export const AsyncSelect = forwardRef(function AsyncSelect<BO, IsMulti extends boolean = false>(
  { forceMenuOpen, ...props }: AsyncProps<BO, IsMulti, GroupBase<BO>> & { forceMenuOpen?: boolean },
  ref: Ref<SelectInstance<BO, IsMulti>>,
) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen, forceMenuOpen);
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
}) as <BO, IsMulti extends boolean = false>(
  props: AsyncProps<BO, IsMulti, GroupBase<BO>> & { forceMenuOpen?: boolean; ref?: Ref<SelectInstance<BO, IsMulti>> },
) => ReturnType<typeof AsyncReactSelect>;

export const CreatableSelect = forwardRef(function CreatableSelect<BO, IsMulti extends boolean = false>(
  { forceMenuOpen, ...props }: CreatableProps<BO, IsMulti, GroupBase<BO>> & { forceMenuOpen?: boolean },
  ref: Ref<SelectInstance<BO, IsMulti>>,
) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen, forceMenuOpen);
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
}) as <BO, IsMulti extends boolean = false>(
  props: CreatableProps<BO, IsMulti, GroupBase<BO>> & {
    forceMenuOpen?: boolean;
    ref?: Ref<SelectInstance<BO, IsMulti>>;
  },
) => ReturnType<typeof CreatableReactSelect>;

export const AsyncCreatableSelect = forwardRef(function AsyncCreatableSelect<BO, IsMulti extends boolean = false>(
  { forceMenuOpen, ...props }: AsyncCreatableProps<BO, IsMulti, GroupBase<BO>> & { forceMenuOpen?: boolean },
  ref: Ref<SelectInstance<BO, IsMulti>>,
) {
  const { portalTarget } = useContext(UIContext);
  const defaultProps = useDefaultSelectProps(props.defaultMenuIsOpen, forceMenuOpen);
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
}) as <BO, IsMulti extends boolean = false>(
  props: AsyncCreatableProps<BO, IsMulti, GroupBase<BO>> & {
    forceMenuOpen?: boolean;
    ref?: Ref<SelectInstance<BO, IsMulti>>;
  },
) => ReturnType<typeof AsyncCreatableReactSelect>;
