import { FC, useCallback } from "react";
import AsyncSelect from "react-select/async";
import { OptionProps, SingleValueProps } from "react-select";
import cx from "classnames";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

import { useSearch, useAppearance } from "../core/context/dataContexts";
import { SearchIcon } from "./common-icons";
import { NodeComponentById } from "./Node";

interface OptionItem {
  type: "nodes";
  id: string;
}
interface OptionMessage {
  type: "message";
  i18nCode: string;
  i18nParams: { [key: string]: unknown };
}

const RESULT_MAX_SIZE = 25;

type Option = OptionItem | OptionMessage;

const OptionComponent = ({ data, innerProps, className, isFocused }: OptionProps<Option, false>) => {
  const { t } = useTranslation();
  console.log(data, innerProps, className, isFocused);
  return (
    <div {...innerProps} className={className} onMouseMove={undefined} onMouseOver={undefined}>
      <div
        className={cx(
          className,
          "d-flex m-1 hoverable text-ellipsis d-flex align-items-center",
          isFocused && "bg-light",
        )}
      >
        {data.type === "nodes" && <NodeComponentById id={data.id} />}
        {data.type === "message" && (
          <div className="text-center p-2 text-muted">
            <span>{t(`search.${data.i18nCode}`, data.i18nParams)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const IndicatorComponent = () => {
  return (
    <div className="text-center p-2">
      <SearchIcon size="1.5rem" />
    </div>
  );
};

const SingleValue = ({ data }: SingleValueProps<Option>) =>
  data.type === "nodes" ? <NodeComponentById id={data.id} /> : null;

/**
 * Search a node
 */
export const NodeSearch: FC<{
  className?: string;
  onChange: (result: string | null) => void;
  value: string | null;
}> = ({ className, onChange, value }) => {
  const { t } = useTranslation();
  const { index } = useSearch();
  const { nodesLabel } = useAppearance();

  /**
   * What we do when user select an item in the list
   *  If it's node, we add it to the selection
   */
  const doOnChange = useCallback(
    (option: Option | null) => {
      if (!option || option.type === "nodes") onChange(option?.id || null);
    },
    [onChange],
  );

  /**
   * Loading the options while the user is typing.
   */
  const loadOptions = useCallback(
    (query: string, callback: (options: Option[]) => void) => {
      const searchResult = index.search(query, {
        prefix: true,
        filter: (result) => result.type === "nodes",
        fuzzy: 0.2,
        boost: {
          ...(nodesLabel.type === "field" ? { [nodesLabel.field]: 2 } : { label: 2 }),
        },
      });

      const result: Option[] = searchResult
        .slice(0, RESULT_MAX_SIZE - 1)
        .map((item) => ({ id: item.id, type: item.type }));

      if (searchResult.length > 1) {
        if (searchResult.length > RESULT_MAX_SIZE) {
          result.push({
            type: "message",
            i18nCode: "other_result",
            i18nParams: { count: searchResult.length - RESULT_MAX_SIZE },
          });
        }
      }
      callback(result);
    },
    [index, nodesLabel],
  );

  return (
    <AsyncSelect<Option>
      isClearable
      controlShouldRenderValue={!!value}
      isMulti={false}
      className={className}
      placeholder={t("search.node.placeholder")}
      value={value ? { type: "nodes", id: value } : null}
      loadOptions={debounce(loadOptions, 200)}
      onChange={doOnChange}
      components={{
        SingleValue,
        Option: OptionComponent,
        DropdownIndicator: IndicatorComponent,
        NoOptionsMessage: (props) => {
          const { t } = useTranslation();
          return (
            <div className="text-center p-2 text-muted">
              {props.selectProps.inputValue.length > 0 ? (
                <span>{t("search.node.no_result")}</span>
              ) : (
                <span>{t("search.node.help")}</span>
              )}
            </div>
          );
        },
      }}
      styles={{
        menu: (styles) => ({ ...styles, borderRadius: 0 }),
        control: (styles) => {
          return {
            ...styles,
          };
        },
        valueContainer: (provided) => ({
          ...provided,
          display: "flex",
          flexWrap: "nowrap",
        }),
      }}
    />
  );
};
