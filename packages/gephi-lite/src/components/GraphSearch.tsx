import cx from "classnames";
import { debounce } from "lodash";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type DropdownIndicatorProps,
  type IndicatorsContainerProps,
  OptionProps,
  SingleValueProps,
  components,
} from "react-select";

import { useAppearance, useSearch } from "../core/context/dataContexts";
import { ItemType } from "../core/types";
import { CancelIcon, SearchIcon } from "./common-icons";
import { EdgeComponentById } from "./data/Edge";
import { NodeComponentById } from "./data/Node";
import { AsyncSelect } from "./forms/Select";

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
   * clears it but the caller). When it is non-empty on mount, the matching results are loaded and
   * the dropdown opens right away, so reopening a panel shows the previous search and its results.
   * Pair it with `onInputChange` to keep the caller's state up to date.
   */
  inputValue?: string;
  /**
   * Called with the raw text typed in the input, as opposed to `onChange` which only fires when an
   * item gets selected.
   */
  onInputChange?: (value: string) => void;
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
}) => {
  const { t } = useTranslation();
  const { index } = useSearch();
  const { nodesLabel, edgesLabel } = useAppearance();

  // Whether the caller handed us text to restore right when we mounted: that text deserves its
  // results on screen immediately (see `restoredOptions` below and `defaultMenuIsOpen`).
  const restoredOnMount = useRef(!!inputValue).current;

  /**
   * Loading the options while the user is typing.
   */
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

  // react-select only keeps loaded options for text the user is *currently typing*: it drops them as
  // soon as an item is picked, and never has any for text restored on mount. In both cases the
  // dropdown would then claim "no result" for a query that does match. So we keep the results for
  // that text ourselves, and hand them over as `defaultOptions` (which react-select falls back to
  // exactly when its own async state is empty).
  const [restoredOptions, setRestoredOptions] = useState<Option[] | undefined>(undefined);
  // Refreshed on mount and after picking an item - never while typing, where react-select's own
  // loading already runs (searching twice would also fire `postProcessOptions` side effects twice).
  const refreshRestoredOptions = useCallback(() => {
    if (inputValue) loadOptions(inputValue, setRestoredOptions);
    else setRestoredOptions(undefined);
  }, [inputValue, loadOptions]);

  const refreshOnMount = useRef(refreshRestoredOptions);
  refreshOnMount.current = refreshRestoredOptions;
  useEffect(() => {
    if (restoredOnMount) refreshOnMount.current();
  }, [restoredOnMount]);

  return (
    <AsyncSelect<Option>
      className={className}
      autoFocus={autoFocus}
      isClearable
      controlShouldRenderValue={!!value}
      placeholder={t(`search.${type || "graph"}.placeholder`)}
      value={value || null}
      defaultInputValue={defaultInputValue}
      inputValue={inputValue}
      defaultOptions={restoredOptions}
      defaultMenuIsOpen={restoredOnMount}
      loadOptions={debounce(loadOptions, 200)}
      onChange={(option) => {
        onChange(option);
        // Picking an item makes react-select drop its loaded options, while the text stays (in
        // controlled mode): keep matching results ready for when the user comes back to the field.
        refreshRestoredOptions();
      }}
      onInputChange={(newValue, meta) => {
        if (meta.action !== "input-change") return;
        // While typing, react-select's own loading is authoritative.
        setRestoredOptions(undefined);
        if (onInputChange) onInputChange(newValue);
      }}
      components={{
        SingleValue,
        Option: OptionComponent,
        DropdownIndicator: IndicatorComponent,
        // react-select only renders its own clear indicator when an item is *selected*, so a search
        // box that just holds typed text (no selection) would have no way to be emptied but the
        // keyboard - painful on mobile. Add our own, left of the magnifier and always there but
        // disabled when there is nothing to clear, like the data view's search box (see its
        // SearchForm), so both search fields look and behave the same.
        IndicatorsContainer: (props: IndicatorsContainerProps<Option, false>) => (
          <components.IndicatorsContainer {...props}>
            {!!onInputChange && (
              <button
                type="button"
                className="gl-btn gl-btn-icon"
                title={t("search.clear")}
                aria-label={t("search.clear")}
                disabled={!props.selectProps.inputValue}
                // Keep the focus (and the on-screen keyboard) where it is: a blur would close the
                // menu and, on mobile, make the panel jump.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onInputChange("")}
              >
                <CancelIcon />
              </button>
            )}
            {props.children}
          </components.IndicatorsContainer>
        ),
        NoOptionsMessage: (props) => {
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
      }}
    />
  );
};
