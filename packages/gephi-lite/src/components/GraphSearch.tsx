import cx from "classnames";
import { debounce } from "lodash";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { type DropdownIndicatorProps, OptionProps, SingleValueProps, components } from "react-select";

import { useAppearance, useSearch } from "../core/context/dataContexts";
import { ItemType } from "../core/types";
import { SearchIcon } from "./common-icons";
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
   * What we do when user select an item
   */
  onChange: (e: Option | null) => void;
  /**
   * With this function, you can filter/enhance the result displayed to the user.
   * This can be useful to add action / messages or limit the number of result
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
