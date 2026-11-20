import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  CreateEdgeIcon,
  EditIcon,
  OpenInGraphIcon,
  SelectEdgesIcon,
  SelectNeighborsIcon,
  TrashIcon,
} from "../../components/common-icons";
import { EditEdgeModal } from "../../components/data/EditEdge";
import { EditNodeModal } from "../../components/data/EditNode";
import ConfirmModal from "../../components/modals/ConfirmModal";
import {
  useGraphDataset,
  useGraphDatasetActions,
  useSelection,
  useSelectionActions,
} from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { focusCameraOnNode } from "../../core/sigma";

/** Asks for a confirmation, then deletes the item: the one way to delete a node or an edge from the selection panel. */
export function useConfirmDeleteItem() {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { deleteItems } = useGraphDatasetActions();

  return useCallback(
    (type: "nodes" | "edges", id: string) =>
      openModal({
        component: ConfirmModal,
        arguments: {
          title: t(`edition.delete_${type}`, { count: 0 }),
          message: t(`edition.confirm_delete_${type}`, { count: 1 }),
        },
        afterSubmit: () => {
          deleteItems(type, [id]);
        },
      }),
    [openModal, deleteItems, t],
  );
}

/**
 * Buttons acting on one node: locate it, select its edges or its neighbors, edit it, create an
 * edge from it, delete it. Shared by every place the selection panel shows a node (the selected
 * nodes, and both ends of a selected edge), so that they all behave the same way.
 *
 * `hidden` is for a node the filters exclude: it is not on the graph, so nothing can be located
 * or selected from it.
 */
export const NodeActions: FC<{ id: string; hidden?: boolean }> = ({ id, hidden }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { fullGraph } = useGraphDataset();
  const { select } = useSelectionActions();
  const { type: selectionType, items: selectionItems } = useSelection();
  const confirmDelete = useConfirmDeleteItem();

  // A node without any edge has nothing to select at all: keep both buttons disabled, so clicking
  // them cannot replace the panel by an empty edges selection. Edges/neighbors are taken from the
  // full graph, so the filtered out ones stay part of the resulting selection (reported as
  // filtered) instead of being silently dropped.
  const isIsolated = fullGraph.hasNode(id) && !fullGraph.degree(id);

  return (
    <>
      <button
        className="gl-btn gl-btn-icon"
        title={t("selection.locate_on_graph")}
        aria-label={t("selection.locate_on_graph")}
        disabled={hidden}
        onClick={() => focusCameraOnNode(id)}
      >
        <OpenInGraphIcon />
      </button>
      <button
        className="gl-btn gl-btn-icon"
        title={t("selection.select_node_edges")}
        aria-label={t("selection.select_node_edges")}
        disabled={hidden || isIsolated}
        onClick={() => select({ type: "edges", items: new Set(fullGraph.edges(id)), replace: false })}
      >
        <SelectEdgesIcon />
      </button>
      <button
        className="gl-btn gl-btn-icon"
        title={t("selection.select_node_neighbors")}
        aria-label={t("selection.select_node_neighbors")}
        disabled={hidden || isIsolated}
        onClick={() => select({ type: "nodes", items: new Set(fullGraph.neighbors(id)), replace: false })}
      >
        <SelectNeighborsIcon />
      </button>
      <button
        className="gl-btn gl-btn-icon"
        title={t("edition.update_this_nodes")}
        aria-label={t("edition.update_this_nodes")}
        onClick={() => openModal({ component: EditNodeModal, arguments: { nodeId: id } })}
      >
        <EditIcon />
      </button>
      <button
        className="gl-btn gl-btn-icon"
        title={t("selection.create_edge_from_node")}
        aria-label={t("selection.create_edge_from_node")}
        disabled={hidden}
        onClick={() => {
          // When exactly two nodes are selected, pre-fill the edge target with the other one
          // (source being this node), so only the attributes remain to fill in. Only meaningful
          // for a selection of nodes: with edges selected, there is no "other node".
          const others = Array.from(selectionItems).filter((n) => n !== id);
          const target =
            selectionType === "nodes" && selectionItems.size === 2 && others.length === 1 ? others[0] : undefined;
          openModal({ component: EditEdgeModal, arguments: { source: id, target } });
        }}
      >
        <CreateEdgeIcon />
      </button>
      <button
        className="gl-btn gl-btn-icon ms-3"
        title={t("edition.delete_this_nodes")}
        aria-label={t("edition.delete_this_nodes")}
        onClick={() => confirmDelete("nodes", id)}
      >
        <TrashIcon />
      </button>
    </>
  );
};
