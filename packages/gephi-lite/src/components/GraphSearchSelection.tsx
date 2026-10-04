import { type FC, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useAppearance,
  useGraphDataset,
  useGraphDatasetActions,
  useSearchActions,
  useSearchQuery,
  useSelectionActions,
} from "../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../core/context/eventsContext";
import { useModal } from "../core/modals";
import { useNotifications } from "../core/notifications";
import { GraphSearch, type Option, type OptionItem } from "./GraphSearch";
import ConfirmModal from "./modals/ConfirmModal";

const RESULT_MAX_SIZE = 25;

export const GraphSearchSelection: FC<{ className?: string; visible?: boolean }> = ({ className, visible = true }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { emitter } = useEventsContext();
  const { select } = useSelectionActions();
  const { setQuery } = useSearchActions();
  // A modal (create node/edge, save as...) always covers the whole page: the portaled results
  // dropdown must not keep floating on top of it - see the `visible` prop's doc on GraphSearch.
  const { modal, openModal } = useModal();
  // Controlled input text, kept in an atom rather than inside react-select: the left panel unmounts
  // whenever it is collapsed (or a tool takes its place), so an internal value would be lost every
  // time. Restoring it also brings its results back, see GraphSearch.
  const searchQuery = useSearchQuery();
  const { createNode } = useGraphDatasetActions();
  const { fullGraph } = useGraphDataset();
  // Which field drives a new node's label (falling back to the id, when there is no label field
  // configured): same logic as EditEdge, used below to create a node on the fly when the search
  // matches nothing.
  const { nodesLabel } = useAppearance();
  const labelFieldId = nodesLabel.type === "field" ? nodesLabel.field.id : "id";

  // Offers to create a node named after the typed query, confirmed through the app's standard
  // modal (this field isn't itself rendered inside another modal, unlike EditEdge's source/target
  // search boxes, so no need for EditEdge's stacked-modal workaround).
  const createNodeFromQuery = useCallback(
    (label: string) => {
      openModal({
        component: ConfirmModal,
        beforeSubmit: () => {
          // Below the label field, an id is only ever a free-form field, so re-using it is what
          // makes the created node findable/mergeable with anything typed the same way later;
          // otherwise the id is purely internal, so a random one avoids colliding with anything else.
          const id = labelFieldId === "id" ? label : crypto.randomUUID();
          try {
            createNode(id, labelFieldId === "id" ? {} : { [labelFieldId]: label });
            // Same selection as picking an existing result, so the newly created node is not left
            // looking like it went nowhere, see onChange above.
            select({ type: "nodes", items: new Set([id]) });
            requestAnimationFrame(() => emitter.emit(EVENTS.searchResultsSelected, { type: "nodes", ids: [id] }));
          } catch (e) {
            notify({
              type: "error",
              title: t("edition.create_nodes"),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        },
        arguments: {
          title: t("edition.create_nodes"),
          message: t("edition.confirm_create_node", { label }),
        },
      });
    },
    [openModal, labelFieldId, createNode, select, emitter, notify, t],
  );

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
    (searchResult: Option[], query: string) => {
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

      // Appended when the typed text matches no existing node, so one can be created on the fly
      // rather than forcing the user to look elsewhere: same option (and condition) as the
      // source/target search boxes in the edge editor, see EditEdge's makeNodeCreationOption.
      const label = query.trim();
      if (label && !fullGraph.hasNode(label)) {
        result.push({
          type: "message",
          i18nCode: "nodes.create_option",
          i18nParams: { label },
          action: () => createNodeFromQuery(label),
        });
      }

      return result;
    },
    [emitter, select, fullGraph, createNodeFromQuery],
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
