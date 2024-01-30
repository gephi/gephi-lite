import cx from "classnames";
import { debounce } from "lodash";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { OptionProps, SingleValueProps } from "react-select";
import AsyncSelect from "react-select/async";

import { useAppearance, useSearch } from "../core/context/dataContexts";
import { ItemType } from "../core/types";
import { EdgeComponentById } from "./Edge";
import { NodeComponentById } from "./Node";
import { SearchIcon } from "./common-icons";

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

const OptionComponent = ({ data, innerProps, className, isFocused }: OptionProps<Option, false>) => {
  const { t } = useTranslation();

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
        {data.type === "edges" && <EdgeComponentById id={data.id} />}
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

const SingleValue = ({ data }: SingleValueProps<Option>) => {
  if (data.type === "nodes") return <NodeComponentById id={data.id} />;
  if (data.type === "edges") return <EdgeComponentById id={data.id} />;
  return null;
};

interface GraphSearchProps {
  className?: string;
  value?: Option | null;
  /**
   * If not specified, we search on nodes & edges
   */
  type?: ItemType;
  /**
   * What we do when user select an item
   */
  onChange: (e: Option | null) => void;
  /**
   * With this function, you can filter/enhance the result displayed to the user.
   * This can useful to add action / messages or limit the number of result
   */
  postProcessOptions?: (options: Option[]) => Option[];
}

/**
 * Search a node/edge
 */
export const GraphSearch: FC<GraphSearchProps> = ({ className, onChange, postProcessOptions, type, value }) => {
  const { t } = useTranslation();
  const { index } = useSearch();
  const { nodesLabel, edgesLabel } = useAppearance();

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
            ...(nodesLabel.type === "field" ? { [nodesLabel.field]: 2 } : { label: 2 }),
            ...(edgesLabel.type === "field" ? { [edgesLabel.field]: 2 } : { label: 2 }),
          },
        })
        .map((item) => ({ id: item.id, type: item.type }));

      callback(postProcessOptions ? postProcessOptions(result) : result);
    },
    [index, nodesLabel, edgesLabel, type, postProcessOptions],
  );

  return (
    <AsyncSelect<Option>
      className={className}
      isClearable
      controlShouldRenderValue={!!value}
      placeholder={t(`search.${type || "graph"}.placeholder`)}
      value={value || null}
      loadOptions={debounce(loadOptions, 200)}
      onChange={onChange}
      components={{
        SingleValue,
        Option: OptionComponent,
        DropdownIndicator: IndicatorComponent,
        NoOptionsMessage: (props) => {
          const { t } = useTranslation();
          return (
            <div className="text-center p-2 text-muted">
              {props.selectProps.inputValue.length > 0 ? (
                <span>{t(`search.${type || "graph"}.no_result`)}</span>
              ) : (
                <span>{t(`search.${type || "graph"}.help`)}</span>
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
