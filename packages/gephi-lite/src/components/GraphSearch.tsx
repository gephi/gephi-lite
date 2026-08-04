import cx from "classnames";
import { debounce } from "lodash";
import { FC, MouseEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type DropdownIndicatorProps,
  type IndicatorsContainerProps,
  OptionProps,
  type SelectInstance,
  SingleValueProps,
  components,
} from "react-select";

import { useAppearance, useSearch } from "../core/context/dataContexts";
import { ItemType } from "../core/types";
import { CancelIcon, SearchIcon } from "./common-icons";
import { EdgeComponentById } from "./data/Edge";
import { NodeComponentById } from "./data/Node";
import { AsyncSelect, Select } from "./forms/Select";

export interface OptionItem {
  id: string;
  type: ItemType;
}
export interface OptionMessage {
  type: "message";
  i18nCode: string;
  i18nParams: { [key: string]: unknown };
  action?: () => void;
}

export type Option = OptionItem | OptionMessage;

const OptionComponent = ({ data, ...innerProps }: OptionProps<Option, false>) => {
  const { t } = useTranslation();

  return (
    <components.Option {...innerProps} data={data} className={cx("text-ellipsis d-flex ", innerProps.className)}>
      {data.type === "nodes" && <NodeComponentById id={data.id} />}
      {data.type === "edges" && <EdgeComponentById id={data.id} />}
      {data.type === "message" && (
        <div className="text-center text-muted">
          <span>{t(`search.${data.i18nCode}`, data.i18nParams)}</span>
        </div>
      )}
    </components.Option>
  );
};

const IndicatorComponent = (props: DropdownIndicatorProps<Option, false>) => {
  return (
    <components.DropdownIndicator {...props} className="text-center">
      <SearchIcon />
    </components.DropdownIndicator>
  );
};

const SingleValue = ({ data, ...innerProps }: SingleValueProps<Option, false>) => {
  if (data.type === "message") return null;
  return (
    <components.SingleValue {...innerProps} data={data}>
      {data.type === "nodes" && <NodeComponentById id={data.id} />}
      {data.type === "edges" && <EdgeComponentById id={data.id} />}
    </components.SingleValue>
  );
};

interface GraphSearchProps {
  className?: string;
  value?: Option | null;
  /**
   * If not specified, we search on nodes & edges
   */
  type?: ItemType;
  /**
   * If true, the search input grabs focus as soon as it is mounted.
   */
  autoFocus?: boolean;
  /**
   * What we do when user select an item
   */
  onChange: (e: Option | null) => void;
  /**
   * With this function, you can filter/enhance the result displayed to the user.
   * This can be useful to add action / messages or limit the number of result
   */
  postProcessOptions?: (options: Option[]) => Option[];
  /**
   * Text shown in the input as soon as it is mounted, without selecting any item (unlike `value`).
   * Used to carry over text typed in another search field into this one. react-select owns the text
   * afterwards (it gets cleared on selection, blur...): for text that must survive those, and
   * remounts, use the controlled `inputValue` below instead.
   */
  defaultInputValue?: string;
  /**
   * Controlled input text: the caller owns it, so it survives selection, blur and remounts (nothing
   * clears it but the caller). Pair it with `onInputChange` to keep the caller's state up to date.
   * Switches the whole component to a fully self-managed results list (see `restoredOptions` below),
   * so results and the open dropdown survive an involuntary blur (eg. a parent panel hidden via CSS
   * while this field has focus, which some mobile browsers treat as a blur).
   */
  inputValue?: string;
  /**
   * Called with the raw text typed in the input, as opposed to `onChange` which only fires when an
   * item gets selected.
   */
  onInputChange?: (value: string) => void;
  /**
   * Whether this field's panel is currently shown to the user. Only meaningful in controlled mode:
   * defaults to true, and set to false when another panel takes its place (eg. opening the "create
   * node/edge" or any other side-menu tool on mobile) so the results dropdown - portaled, so it would
   * otherwise keep floating on top of that other panel - gets explicitly closed instead of surviving
   * as it does through an involuntary blur (see `forceMenuOpen` below).
   */
  visible?: boolean;
}

/**
 * Search a node/edge
 */
export const GraphSearch: FC<GraphSearchProps> = ({
  className,
  onChange,
  postProcessOptions,
  type,
  value,
  autoFocus,
  defaultInputValue,
  inputValue,
  onInputChange,
  visible = true,
}) => {
  const { t } = useTranslation();
  const { index } = useSearch();
  const { nodesLabel, edgesLabel } = useAppearance();

  // Controlled mode = the search box whose text must survive everything (see `inputValue` above).
  const isControlled = inputValue !== undefined;

  const loadOptions = useCallback(
    (query: string, callback: (options: Option[]) => void) => {
      const result = index
        .search(query, {
          prefix: true,
          fuzzy: 0.2,
          filter: type ? (result) => result.type === type : undefined,
          boost: {
            // TODO: check if we index dynamicDataAttribute
            ...(nodesLabel.type === "field" ? { [nodesLabel.field.id]: 2 } : { label: 2 }),
            ...(edgesLabel.type === "field" ? { [edgesLabel.field.id]: 2 } : { label: 2 }),
          },
        })
        .map((item) => ({ id: item.id, type: item.type }));

      callback(postProcessOptions ? postProcessOptions(result) : result);
    },
    [index, nodesLabel, edgesLabel, type, postProcessOptions],
  );

  // For the controlled box, options are computed and owned entirely here, as a plain `options` array
  // (see the plain `Select` branch below), instead of relying on react-select's own `loadOptions`
  // machinery (the async wrapper, used for the uncontrolled branch): that machinery privately caches
  // its "loaded options" and wipes them on blur or menu-close - indistinguishable from a deliberate
  // clear - so results kept coming back empty (or not at all) after this field got blurred and
  // refocused involuntarily. Plain React state has no such failure mode: it simply cannot be affected
  // by anything react-select does internally.
  const [restoredOptions, setRestoredOptions] = useState<Option[] | undefined>(undefined);
  const isFirstQuery = useRef(true);
  useEffect(() => {
    if (!isControlled) return;
    if (!inputValue) {
      setRestoredOptions(undefined);
      isFirstQuery.current = true;
      return;
    }
    // The very first query for this mount (eg. reopening a panel, or switching between the Graph and
    // Data views' own instances of this field) gets its results immediately; later ones - live typing
    // - are debounced, same as the uncontrolled branch's `loadOptions`.
    if (isFirstQuery.current) {
      isFirstQuery.current = false;
      loadOptions(inputValue, setRestoredOptions);
      return;
    }
    const timeout = setTimeout(() => loadOptions(inputValue, setRestoredOptions), 200);
    return () => clearTimeout(timeout);
  }, [isControlled, inputValue, loadOptions]);

  // Keep the results open whenever the controlled box holds a computed result set, independently of
  // react-select's own open/close bookkeeping (see `forceMenuOpen` in Select.tsx): a parent panel
  // hidden via CSS while this field has focus makes some mobile browsers blur it involuntarily, which
  // would otherwise close the menu until the user clicks back into the field. Tied to `restoredOptions`
  // rather than to `inputValue` directly so that clearing (see `clearSearch` below) closes the menu
  // within the very same click: both are plain React state set in the same synchronous update,
  // whereas `inputValue` only updates once the caller's own state (an external atom) round-trips back.
  const forceMenuOpen = isControlled && restoredOptions !== undefined;

  // Emptying the search from the button bypasses react-select entirely (it never sees an
  // input-change), so the menu has to be closed by hand: blurring is what does it, and the focus is
  // handed straight back so a new search can be typed right away (focusing alone does not reopen it).
  const selectRef = useRef<SelectInstance<Option, false>>(null);
  const clearSearch = useCallback(() => {
    setRestoredOptions(undefined);
    onInputChange?.("");
    selectRef.current?.blur();
    selectRef.current?.focus();
  }, [onInputChange]);

  const sharedProps = {
    ref: selectRef,
    className,
    autoFocus,
    isClearable: true,
    controlShouldRenderValue: !!value,
    placeholder: t(`search.${type || "graph"}.placeholder`),
    value: value || null,
    inputValue,
    forceMenuOpen,
    // Only relevant in controlled mode, where `forceMenuOpen` above would otherwise keep the portaled
    // dropdown floating on top of whatever panel replaced this one (see the `visible` prop's doc).
    forceMenuClosed: isControlled && !visible,
    // Our own search index already filters (and orders) the options: react-select's default
    // client-side filterOption would try (and fail) to match them by a `label` string our Option
    // type doesn't have, hiding every result. The async wrapper avoids this the same way (it
    // defaults filterOption to null unless told otherwise) - made explicit here for the plain
    // `Select` branch below, which has no such default.
    filterOption: null,
    // Picking a result locates the item, it does not "consume" the search: react-select otherwise
    // hides the input text *and* closes the menu on select (both are gated on this single prop),
    // leaving a box that looks empty until it is clicked again. Keeping them lets the query and its
    // results stay on screen, so several results can be visited in a row. Only for the main search
    // box: in the edge editor, picking a source/target really does end that search.
    closeMenuOnSelect: !isControlled,
    onChange: (option: Option | null) => onChange(option),
    onInputChange: (newValue: string, meta: { action: string }) => {
      if (meta.action !== "input-change") return;
      if (onInputChange) onInputChange(newValue);
    },
    components: {
      SingleValue,
      Option: OptionComponent,
      DropdownIndicator: IndicatorComponent,
      // react-select only renders its own clear indicator when an item is *selected*, so a search box
      // that just holds typed text (no selection) would have no way to be emptied but the keyboard -
      // painful on mobile. Add our own, left of the magnifier and always there but disabled when
      // there is nothing to clear, like the data view's search box (see its SearchForm), so both
      // search fields look and behave the same.
      IndicatorsContainer: (props: IndicatorsContainerProps<Option, false>) => (
        <components.IndicatorsContainer {...props}>
          {!!onInputChange && (
            <button
              type="button"
              className="gl-btn gl-btn-icon"
              title={t("search.clear")}
              aria-label={t("search.clear")}
              disabled={!props.selectProps.inputValue}
              // Clearing happens on pointer down, not on click: react-select's own touchend handler
              // calls preventDefault() for any target that is not the input, which on touch devices
              // swallows the compatibility click - the button then did nothing at all on Android.
              // stopPropagation keeps that same handler from treating the press as a click on the
              // control (which would toggle the menu).
              onPointerDown={(e: PointerEvent) => {
                e.preventDefault();
                e.stopPropagation();
                clearSearch();
              }}
              // Keep the focus (and the on-screen keyboard) where it is: a blur would close the menu
              // and, on mobile, make the panel jump.
              onMouseDown={(e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              // Keyboard activation (Enter/Space) fires no pointer event; clearing twice is a no-op
              // anyway, and the button is disabled as soon as there is nothing left.
              onClick={() => clearSearch()}
            >
              <CancelIcon />
            </button>
          )}
          {props.children}
        </components.IndicatorsContainer>
      ),
      NoOptionsMessage: (props: { selectProps: { inputValue: string } }) => {
        const { t } = useTranslation();
        return (
          <div className="gl-p-2 text-muted">
            {props.selectProps.inputValue.length > 0 ? (
              <span>{t(`search.${type || "graph"}.no_result`)}</span>
            ) : (
              <span>{t(`search.${type || "graph"}.help`)}</span>
            )}
          </div>
        );
      },
    },
  };

  return isControlled ? (
    <Select<Option> {...sharedProps} options={restoredOptions ?? []} isLoading={false} />
  ) : (
    <AsyncSelect<Option>
      {...sharedProps}
      defaultInputValue={defaultInputValue}
      loadOptions={debounce(loadOptions, 200)}
    />
  );
};
