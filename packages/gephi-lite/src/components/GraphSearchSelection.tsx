import { type FC, useCallback } from "react";

import { useSearchActions, useSearchQuery, useSelectionActions } from "../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../core/context/eventsContext";
import { useModal } from "../core/modals";
import { GraphSearch, type Option, type OptionItem } from "./GraphSearch";

const RESULT_MAX_SIZE = 25;

export const GraphSearchSelection: FC<{ className?: string; visible?: boolean }> = ({ className, visible = true }) => {
  const { emitter } = useEventsContext();
  const { select } = useSelectionActions();
  const { setQuery } = useSearchActions();
  // A modal (create node/edge, save as...) always covers the whole page: the portaled results
  // dropdown must not keep floating on top of it - see the `visible` prop's doc on GraphSearch.
  const { modal } = useModal();
  // Controlled input text, kept in an atom rather than inside react-select: the left panel unmounts
  // whenever it is collapsed (or a tool takes its place), so an internal value would be lost every
  // time. Restoring it also brings its results back, see GraphSearch.
  const searchQuery = useSearchQuery();

  const onChange = useCallback(
    (option: Option | null) => {
      if (option) {
        if (option.type === "message") {
          if (option.action) option.action();
        } else {
          select({ type: option.type, items: new Set([option.id]) });

          requestAnimationFrame(() =>
            emitter.emit(EVENTS.searchResultsSelected, { type: option.type, ids: [option.id] }),
          );
        }
      }
    },
    [emitter, select],
  );

  const postProcessOptions = useCallback(
    (searchResult: Option[]) => {
      const result: Option[] = searchResult.slice(0, RESULT_MAX_SIZE - 1);

      if (searchResult.length > 1) {
        if (searchResult.length > RESULT_MAX_SIZE) {
          result.push({
            type: "message",
            i18nCode: "graph.other_result",
            i18nParams: { count: searchResult.length - RESULT_MAX_SIZE },
          });
        } else {
          const nodesResult = result.filter((r): r is OptionItem => r.type === "nodes").map((r) => r.id);
          if (nodesResult.length > 1) {
            result.push({
              type: "message",
              i18nCode: "nodes.select_all",
              i18nParams: { count: nodesResult.length },
              action: () => {
                select({
                  type: "nodes",
                  items: new Set(nodesResult),
                });
              },
            });

            requestAnimationFrame(() =>
              emitter.emit(EVENTS.searchResultsSelected, { type: "nodes", ids: nodesResult }),
            );
          }

          const edgesResult = result.filter((r): r is OptionItem => r.type === "edges").map((r) => r.id);
          if (edgesResult.length > 1) {
            result.push({
              type: "message",
              i18nCode: "edges.select_all",
              i18nParams: { count: edgesResult.length },
              action: () => {
                select({
                  type: "edges",
                  items: new Set(edgesResult),
                });
              },
            });

            requestAnimationFrame(() =>
              emitter.emit(EVENTS.searchResultsSelected, { type: "edges", ids: edgesResult }),
            );
          }
        }
      }

      return result;
    },
    [emitter, select],
  );

  return (
    <GraphSearch
      className={className}
      value={null}
      onChange={onChange}
      postProcessOptions={postProcessOptions}
      inputValue={searchQuery}
      onInputChange={setQuery}
      visible={visible && !modal}
    />
  );
};
