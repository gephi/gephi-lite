import { FC, useCallback } from "react";
import AsyncSelect from "react-select/async";
import { OptionProps } from "react-select";
import cx from "classnames";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

import { ItemType } from "../core/types";
import { useSearch, useSelectionActions, useAppearance } from "../core/context/dataContexts";
import { SearchIcon } from "./common-icons";
import { NodeComponentById } from "./Node";
import { EdgeComponentById } from "./Edge";

interface OptionItem {
  id: string;
  type: ItemType;
}
interface OptionMessage {
  type: "message";
  i18nCode: string;
  i18nParams: { [key: string]: unknown };
  action?: () => void;
}

const RESULT_MAX_SIZE = 25;

type Option = OptionItem | OptionMessage;

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

/**
 * Search a node/edge
 * By default we use the selectNode from the context, but you
 */
export const GraphSearch: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const { index } = useSearch();
  const { select } = useSelectionActions();
  const { nodesLabel, edgesLabel } = useAppearance();

  /**
   * What we do when user select an item in the list
   *  If it's node/edge, we add it to the selection
   *  If it's an action, we execute it
   */
  const onChange = useCallback(
    (option: Option | null) => {
      if (option) {
        if (option.type === "nodes" || option.type === "edges")
          select({ type: option.type, items: new Set([option.id]) });

        if (option.type === "message" && option.action) option.action();
      }
    },
    [select],
  );

  /**
   * Loading the options while the user is typing.
   */
  const loadOptions = useCallback(
    (query: string, callback: (options: Option[]) => void) => {
      const searchResult = index.search(query, {
        prefix: true,
        fuzzy: 0.2,
        boost: {
          ...(nodesLabel.type === "field" ? { [nodesLabel.field]: 2 } : { label: 2 }),
          ...(edgesLabel.type === "field" ? { [edgesLabel.field]: 2 } : { label: 2 }),
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
        } else {
          const nodesResult = result.filter((r): r is OptionItem => r.type === "nodes").map((r) => r.id);
          if (nodesResult.length > 0) {
            result.push({
              type: "message",
              i18nCode: "select_all_nodes",
              i18nParams: { count: nodesResult.length },
              action: () => {
                select({
                  type: "nodes",
                  items: new Set(nodesResult),
                });
              },
            });
          }

          const edgesResult = result.filter((r): r is OptionItem => r.type === "edges").map((r) => r.id);
          if (edgesResult.length > 0) {
            result.push({
              type: "message",
              i18nCode: "select_all_edges",
              i18nParams: { count: edgesResult.length },
              action: () => {
                select({
                  type: "edges",
                  items: new Set(edgesResult),
                });
              },
            });
          }
        }
      }

      callback(result);
    },
    [index, select, nodesLabel, edgesLabel],
  );

  return (
    <AsyncSelect<Option>
      className={className}
      isClearable
      placeholder={t("search.placeholder")}
      value={null}
      loadOptions={debounce(loadOptions, 200)}
      onChange={onChange}
      components={{
        Option: OptionComponent,
        DropdownIndicator: IndicatorComponent,
        NoOptionsMessage: (props) => {
          const { t } = useTranslation();
          return (
            <div className="text-center p-2 text-muted">
              {props.selectProps.inputValue.length > 0 ? (
                <span>{t("search.no_result")}</span>
              ) : (
                <span>{t("search.help")}</span>
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
      }}
    />
  );
};
