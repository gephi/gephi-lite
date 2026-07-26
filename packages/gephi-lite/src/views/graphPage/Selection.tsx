import { DEFAULT_NODE_COLOR, FieldModel, NodeCoordinates, Scalar, StaticDynamicItemData } from "@gephi/gephi-lite-sdk";
import { groupBy, isNil, toPairs, values } from "lodash";
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AnimateHeight from "react-animate-height";
import { useTranslation } from "react-i18next";
import { PiChecks } from "react-icons/pi";
import { useNavigate } from "react-router";

import Dropdown from "../../components/Dropdown";
import { InfiniteScroll } from "../../components/InfiniteScroll";
import {
  CaretDownIcon,
  CaretUpIcon,
  CloseIcon,
  CreateEdgeIcon,
  EditIcon,
  FieldModelIcon,
  OpenInGraphIcon,
  SelectEdgesIcon,
  SelectNeighborsIcon,
  SelectPathIcon,
  SwapIcon,
  ThreeDotsVerticalIcon,
  TrashIcon,
} from "../../components/common-icons";
import { RenderItemAttribute, RenderText } from "../../components/data/Attribute";
import { EdgeComponent } from "../../components/data/Edge";
import { EditEdgeModal } from "../../components/data/EditEdge";
import { EditNodeModal } from "../../components/data/EditNode";
import { NodeComponent } from "../../components/data/Node";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { getItemAttributes } from "../../core/appearance/utils";
import {
  useDataTableActions,
  useDynamicItemData,
  useFilteredGraph,
  useGraphDataset,
  useGraphDatasetActions,
  useSelection,
  useSelectionActions,
  useSigmaGraph,
  useVisualGetters,
} from "../../core/context/dataContexts";
import {
  DYNAMIC_ATTRIBUTES,
  mergeStaticDynamicData,
  staticDynamicAttributeLabel,
} from "../../core/graph/dynamicAttributes";
import { getShortestPathEdges } from "../../core/graph/utils";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { focusCameraOnEdges, focusCameraOnNode, focusCameraOnNodes } from "../../core/sigma";
import { useLocateInGraph } from "../../hooks/useLocateInGraph";

function SelectedItem<
  // eslint-disable-next-line
  T extends { type: "nodes"; data: NodeCoordinates } | { type: "edges"; data: {} },
>({
  type,
  id,
  data,
  renderingData,
  selectionSize,
}: {
  type: T["type"];
  id: string;
  data: StaticDynamicItemData;
  renderingData: T["data"];
  selectionSize?: number;
}) {
  const initiallyExpanded = useMemo(() => selectionSize === 1, [selectionSize]);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const { t } = useTranslation();
  const { openModal } = useModal();

  const sigmaGraph = useSigmaGraph();
  const graphDataset = useGraphDataset();
  const { edgeFields, nodeFields, fullGraph, nodeData } = graphDataset;
  const { dynamicNodeData } = useDynamicItemData();
  const fields = useMemo(() => (type === "edges" ? edgeFields : nodeFields), [edgeFields, nodeFields, type]);

  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();
  const { deleteItems, updateEdge } = useGraphDatasetActions();
  const { select, unselect } = useSelectionActions();
  const { items: selectionItems } = useSelection();
  const { locateNode, locateEdge } = useLocateInGraph();

  const attributes = useMemo<{ label: ReactNode; value: Scalar; field?: FieldModel }[]>(
    () => [
      ...fields.map((field) => ({
        label: staticDynamicAttributeLabel(field),
        field,
        value: data.static[field.id],
      })),
      ...values(DYNAMIC_ATTRIBUTES[type]).map(({ field }) => ({
        label: staticDynamicAttributeLabel(field),
        field: field as FieldModel,
        value: data.dynamic[field.id],
      })),
      ...toPairs(renderingData).map(([key, value]) => ({
        label: key,
        value,
        field: { type: "number", id: key, itemType: type } as FieldModel,
      })),
      { label: t(`graph.model.${type}-data.id`), value: id },
    ],
    [data.dynamic, data.static, fields, id, renderingData, t, type],
  );

  const item = getItemAttributes(type, id, filteredGraph, data, graphDataset, visualGetters);

  // Node's edges/neighbors are taken from the full graph, so the filtered out ones stay part of the
  // resulting selection (reported as filtered) instead of being silently dropped. A node without
  // any edge has nothing to select at all: keep both buttons disabled, so clicking them cannot
  // replace this panel by an empty edges selection.
  const isIsolated = type === "nodes" && fullGraph.hasNode(id) && !fullGraph.degree(id);
  let content: ReactNode;
  if (type === "nodes") {
    content = (
      <NodeComponent
        label={item.label}
        color={item.color}
        hidden={item.hidden}
        onClick={() => locateNode(id)}
        buttonTitle={t("selection.locate_on_graph")}
      />
    );
  } else {
    //if edge is filtered out, use nodeData to compute rendering data and not sigmaGraph
    const mergedStaticDynamicNodeData =
      !item.hidden && sigmaGraph.hasEdge(id) ? {} : mergeStaticDynamicData(nodeData, dynamicNodeData);

    // Node identity is always read from fullGraph (the source of truth, which gets a fresh
    // reference on every edit and re-renders this panel); the rendered attributes come from
    // sigmaGraph when the edge is visible. Reading identity from sigmaGraph would leave the
    // panel stale after an edge edit, since sigmaGraph keeps a stable reference.
    const source =
      !item.hidden && sigmaGraph.hasEdge(id)
        ? sigmaGraph.getNodeAttributes(fullGraph.source(id))
        : getItemAttributes(
            "nodes",
            fullGraph.source(id),
            filteredGraph,
            mergedStaticDynamicNodeData[fullGraph.source(id)],
            graphDataset,
            visualGetters,
          );
    const target =
      !item.hidden && sigmaGraph.hasEdge(id)
        ? sigmaGraph.getNodeAttributes(fullGraph.target(id))
        : getItemAttributes(
            "nodes",
            fullGraph.target(id),
            filteredGraph,
            mergedStaticDynamicNodeData[fullGraph.target(id)],
            graphDataset,
            visualGetters,
          );

    content = (
      <EdgeComponent
        {...item}
        source={{ ...source, label: source.label ?? null, color: source.color ?? DEFAULT_NODE_COLOR }}
        target={{ ...target, label: target.label ?? null, color: target.color ?? DEFAULT_NODE_COLOR }}
        className="mb-2"
        nodeButtonTitle={t("selection.locate_on_graph")}
        edgeButtonTitle={t("selection.locate_on_graph")}
        onSourceClick={() => locateNode(fullGraph.source(id))}
        onTargetClick={() => locateNode(fullGraph.target(id))}
        onEdgeClick={() => locateEdge(id)}
      />
    );
  }

  useEffect(() => {
    // Close item if a new item has been added to the selection:
    // Open item if it is newly alone:
    setExpanded(initiallyExpanded);
  }, [initiallyExpanded]);

  return (
    <li className={`selected-${type}-item`}>
      <h4 className="fs-6 d-flex flex-row align-items-center mb-0">
        <button
          className="gl-btn gl-btn-icon flex-shrink-0"
          title={t(`selection.unselect_${type}`)}
          aria-label={t(`selection.unselect_${type}`)}
          onClick={() => unselect({ type, items: new Set([id]) })}
        >
          <CloseIcon />
        </button>
        <div className="flex-grow-1 flex-shrink-1 text-ellipsis" title={item.label}>
          {content}
        </div>

        <button
          className="gl-btn gl-btn-icon"
          title={t(expanded ? "common.collapse" : "common.expand")}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <CaretUpIcon /> : <CaretDownIcon />}
        </button>

        <Dropdown
          options={[
            {
              label: t(`selection.unselect_${type}`),
              onClick: () => unselect({ type, items: new Set([id]) }),
            },
            {
              label: t(`selection.focus_${type}`),
              onClick: () => select({ type, items: new Set([id]), replace: true }),
              disabled: item.hidden || selectionSize === 1,
            },
          ]}
        >
          <button className="gl-btn gl-btn-icon" title={t("common.show_more")}>
            <ThreeDotsVerticalIcon />
          </button>
        </Dropdown>
      </h4>

      <div className="d-flex flex-row align-items-center gl-gap-1 pb-2 mb-2 border-bottom">
        <button
          className="gl-btn gl-btn-icon"
          title={t(`selection.locate_on_graph`)}
          disabled={item.hidden}
          onClick={() => {
            if (type === "nodes") focusCameraOnNode(id);
            // Focus on this single edge: keep only it selected (so only its source and target
            // labels remain shown) then center the camera on it.
            else locateEdge(id);
          }}
        >
          <OpenInGraphIcon />
        </button>
        {type === "nodes" && (
          <button
            className="gl-btn gl-btn-icon"
            title={t(`selection.select_node_edges`)}
            disabled={item.hidden || isIsolated}
            onClick={() => {
              select({ type: "edges", items: new Set(fullGraph.edges(id)), replace: false });
            }}
          >
            <SelectEdgesIcon />
          </button>
        )}
        {type === "nodes" && (
          <button
            className="gl-btn gl-btn-icon"
            title={t(`selection.select_node_neighbors`)}
            disabled={item.hidden || isIsolated}
            onClick={() => {
              select({ type, items: new Set(fullGraph.neighbors(id)), replace: false });
            }}
          >
            <SelectNeighborsIcon />
          </button>
        )}
        <button
          className="gl-btn gl-btn-icon"
          title={t(`edition.update_this_${type}`)}
          onClick={() =>
            type === "nodes"
              ? openModal({ component: EditNodeModal, arguments: { nodeId: id } })
              : openModal({ component: EditEdgeModal, arguments: { edgeId: id } })
          }
        >
          <EditIcon />
        </button>
        {type === "nodes" && (
          <button
            className="gl-btn gl-btn-icon"
            title={t(`selection.create_edge_from_node`)}
            disabled={item.hidden}
            onClick={() => {
              // When exactly two nodes are selected, pre-fill the edge target with the other
              // one (source being this node), so only the attributes remain to fill in.
              const others = Array.from(selectionItems).filter((n) => n !== id);
              const target = selectionItems.size === 2 && others.length === 1 ? others[0] : undefined;
              openModal({ component: EditEdgeModal, arguments: { source: id, target } });
            }}
          >
            <CreateEdgeIcon />
          </button>
        )}
        {type === "edges" && (
          <button
            className="gl-btn gl-btn-icon"
            title={t("edition.invert_edge_direction")}
            onClick={() => {
              updateEdge(id, {}, { merge: true, source: fullGraph.target(id), target: fullGraph.source(id) });
            }}
          >
            <SwapIcon />
          </button>
        )}
        <button
          className={`gl-btn gl-btn-icon${type === "nodes" ? " ms-3" : ""}`}
          title={t(`edition.delete_this_${type}`)}
          onClick={() => {
            openModal({
              component: ConfirmModal,
              arguments: {
                title: t(`edition.delete_${type}`, { count: 0 }),
                message: t(`edition.confirm_delete_${type}`, { count: 1 }),
              },
              afterSubmit: () => {
                deleteItems(type, [id]);
              },
            });
          }}
        >
          <TrashIcon />
        </button>
      </div>

      <AnimateHeight height={expanded ? "auto" : 0} className="position-relative" duration={400}>
        <ul className="attributes-list list-unstyled small">
          {attributes.map((attribute, i) => (
            <li
              key={i}
              className="overflow-hidden  gl-py-2 d-flex flex-column  flex-wrap align-items-start gl-gap-x-2 gl-gap-y-1 "
            >
              <span className="d-inline-flex align-items-center gl-gap-1 text-break ">
                {attribute.field && <FieldModelIcon type={attribute.field.type} />}
                {attribute.label}
              </span>{" "}
              <span className="text-break">
                {!isNil(attribute.value) ? (
                  attribute.field ? (
                    <RenderItemAttribute value={attribute.value} field={attribute.field} />
                  ) : (
                    <RenderText value={attribute.value + ""} />
                  )
                ) : (
                  <span className="fst-italic">{t("selection.no_value")}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </AnimateHeight>
    </li>
  );
}

export const Selection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const { type, items } = useSelection();
  const { select } = useSelectionActions();
  const { showSelection } = useDataTableActions();
  const { deleteItems } = useGraphDatasetActions();
  const filteredGraph = useFilteredGraph();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const { fullGraph, nodeData, edgeData, layout } = useGraphDataset();
  const { getNodeLabel, getEdgeLabel } = useVisualGetters();
  const [showFiltered, setShowFiltered] = useState(false);

  const mergedStaticDynamicItemData = useMemo(() => {
    return mergeStaticDynamicData(
      type === "nodes" ? nodeData : edgeData,
      type === "nodes" ? dynamicNodeData : dynamicEdgeData,
    );
  }, [nodeData, dynamicNodeData, dynamicEdgeData, edgeData, type]);

  const nodeAllData = useMemo(() => mergeStaticDynamicData(nodeData, dynamicNodeData), [nodeData, dynamicNodeData]);

  // With exactly two nodes selected, show how they are connected: select the edges of a shortest
  // path between them, which the graph rendering already emphasizes while dimming everything else,
  // then frame the camera on them. The path is searched in the full graph, so an edge hidden by a
  // filter still counts (and is then reported as filtered in the panel, like any other selection).
  const selectPathBetweenNodes = useCallback(() => {
    const [source, target] = Array.from(items);
    const edges = getShortestPathEdges(fullGraph, source, target);
    if (!edges?.length) {
      notify({ message: t("selection.no_path_between_nodes"), type: "warning" });
      return;
    }
    select({ type: "edges", items: new Set(edges), replace: true });
    focusCameraOnEdges(edges);
  }, [items, fullGraph, select, notify, t]);

  // For edges, sort the selection by source label, then target label, then edge label, so a
  // multi-edge selection is easy to scan through instead of appearing in arbitrary (Set) order.
  const getEdgeSortKey = useCallback(
    (id: string): [string, string, string] => {
      const sourceLabel = getNodeLabel?.(nodeAllData[fullGraph.source(id)]) || fullGraph.source(id);
      const targetLabel = getNodeLabel?.(nodeAllData[fullGraph.target(id)]) || fullGraph.target(id);
      const edgeLabel = getEdgeLabel?.(mergedStaticDynamicItemData[id]) || "";
      return [sourceLabel, targetLabel, edgeLabel];
    },
    [fullGraph, nodeAllData, getNodeLabel, getEdgeLabel, mergedStaticDynamicItemData],
  );
  const compareEdges = useCallback(
    (a: string, b: string) => {
      const keyA = getEdgeSortKey(a);
      const keyB = getEdgeSortKey(b);
      return keyA[0].localeCompare(keyB[0]) || keyA[1].localeCompare(keyB[1]) || keyA[2].localeCompare(keyB[2]);
    },
    [getEdgeSortKey],
  );

  const { visible = [], hidden = [] } = useMemo(() => {
    const isVisible =
      type === "nodes" ? filteredGraph.hasNode.bind(filteredGraph) : filteredGraph.hasEdge.bind(filteredGraph);
    const grouped = groupBy(Array.from(items), (item) => (isVisible(item) ? "visible" : "hidden"));
    if (type === "edges") {
      grouped.visible?.sort(compareEdges);
      grouped.hidden?.sort(compareEdges);
    }
    return grouped;
  }, [filteredGraph, items, type, compareEdges]);

  const renderSelectedItem = useCallback(
    (item: string) => {
      const itemData = mergedStaticDynamicItemData[item];
      // itemData can be transiently undefined right after an item is created and selected:
      // the selection atom may reference the new item before the graph dataset atom has caught
      // up. Skip rendering for that frame to avoid crashing; it self-heals on the next render.
      if (!itemData) return null;
      return (
        <SelectedItem
          id={item}
          key={item}
          type={type}
          selectionSize={items.size}
          data={itemData}
          renderingData={type === "nodes" ? layout[item] : {}}
        />
      );
    },
    [mergedStaticDynamicItemData, type, items.size, layout],
  );

  // Scroll the panel back to top whenever the selection is fully replaced by an unrelated one (e.g.
  // locating a node/edge from within another item's card, or jumping to a fresh item on the graph),
  // so the newly shown item's header is visible instead of leaving the scroll position of the
  // previous (longer) list stuck near its own bottom. A partial change (unselecting/toggling one
  // item within the same list) keeps the scroll position, since the list is still the same one.
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const previousSelectionRef = useRef<{ type: typeof type; items: typeof items }>({ type, items });
  useEffect(() => {
    const previous = previousSelectionRef.current;
    const isUnrelatedSelection =
      previous.type !== type || (items.size > 0 && Array.from(items).every((id) => !previous.items.has(id)));
    if (isUnrelatedSelection) panelBodyRef.current?.scrollTo({ top: 0 });
    previousSelectionRef.current = { type, items };
  }, [type, items]);

  return (
    <>
      {/* Selection main list */}
      <div className="panel-body gap-1" ref={panelBodyRef}>
        <div className="d-flex flex-row align-items-start justify-content-between gl-gap-1">
          <h2 className="mb-0">
            {t(`selection.selected_${type}`)}
            {hidden.length > 0 ? (
              // Counts go on their own line, so the longer "(9, 10 filtered)" form is never
              // truncated by the title next to it.
              <span className="d-block">
                ({visible.length},{" "}
                <span className="text-danger">{t("selection.filtered", { count: hidden.length })}</span>)
              </span>
            ) : (
              <> ({items.size})</>
            )}
          </h2>
          {type === "nodes" && items.size === 2 && (
            <button
              className="gl-btn gl-btn-icon flex-shrink-0"
              title={t("selection.select_path_between_nodes")}
              aria-label={t("selection.select_path_between_nodes")}
              onClick={selectPathBetweenNodes}
            >
              <SelectPathIcon />
            </button>
          )}
          {visible.length > 0 && (
            <button
              className="gl-btn gl-btn-icon flex-shrink-0"
              title={t(`selection.locate_selected_${type}`)}
              onClick={() => (type === "nodes" ? focusCameraOnNodes(visible) : focusCameraOnEdges(visible))}
            >
              <OpenInGraphIcon />
            </button>
          )}
        </div>
        <hr className="gl-m-0" />
        <ul className="list-unstyled gl-m-0 gl-gap-1">
          <InfiniteScroll pageSize={50} data={visible} scrollableTarget={"selection"} renderItem={renderSelectedItem} />
        </ul>

        {/* Selected items the filters exclude: collapsed by default, since they are not on the
            graph, but announced by a heading as prominent as the panel's title. */}
        {!!hidden.length && (
          <>
            <div className="d-flex flex-row align-items-center justify-content-between gl-gap-1 mt-3">
              <h2 className="mb-0 text-danger">{t(`selection.filtered_${type}`, { count: hidden.length })}</h2>
              <button
                className="gl-btn gl-btn-icon flex-shrink-0"
                title={t(showFiltered ? "common.collapse" : "common.expand")}
                aria-expanded={showFiltered}
                onClick={() => setShowFiltered((v) => !v)}
              >
                {showFiltered ? <CaretUpIcon /> : <CaretDownIcon />}
              </button>
            </div>
            <hr className="gl-m-0" />
            {showFiltered && (
              <ul className="list-unstyled gl-m-0 gl-gap-1">
                <InfiniteScroll
                  scrollableTarget={"selection"}
                  pageSize={50}
                  data={hidden}
                  renderItem={renderSelectedItem}
                />
              </ul>
            )}
          </>
        )}
      </div>

      {/* Selection actions */}
      <div className="panel-footer">
        <div className="gl-actions flex-row-reverse flex-sm-row justify-content-sm-start">
          <button
            className="gl-btn gl-btn-icon gl-btn-fill"
            onClick={() => {
              showSelection(type);
              navigate(`/data/${type}`, { replace: true });
            }}
          >
            {t("selection.open_in_data")}
          </button>
          <button
            className="gl-btn gl-btn-icon gl-btn-outline"
            onClick={() =>
              select({
                type,
                replace: true,
                items: new Set(type === "nodes" ? filteredGraph.nodes() : filteredGraph.edges()),
              })
            }
            title={t("selection.select_all")}
          >
            <PiChecks />
          </button>
          <button
            className="gl-btn gl-btn-icon gl-btn-outline"
            onClick={() =>
              openModal({
                component: ConfirmModal,
                arguments: {
                  title: t(`edition.delete_selected_${type}`),
                  message: t(`edition.confirm_delete_${type}`, { count: items.size }),
                  successMsg: t(`edition.delete_${type}_success`, { count: items.size }),
                },
                afterSubmit: () => {
                  deleteItems(type, Array.from(items));
                },
              })
            }
            title={t(`edition.delete_selected_${type}`)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </>
  );
};
