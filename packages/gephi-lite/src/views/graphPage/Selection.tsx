import { StaticDynamicItemData } from "@gephi/gephi-lite-sdk";
import { groupBy, isNil, toPairs } from "lodash";
import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import AnimateHeight from "react-animate-height";
import { useTranslation } from "react-i18next";
import { AiFillEdit } from "react-icons/ai";
import { BiTargetLock } from "react-icons/bi";
import { BsChevronDown, BsChevronUp, BsFillTrashFill, BsThreeDotsVertical } from "react-icons/bs";
import { MdDeselect, MdFilterCenterFocus, MdSelectAll } from "react-icons/md";
import ReactLinkify from "react-linkify";

import ConfirmModal from "../../components//modals/ConfirmModal";
import Dropdown from "../../components/Dropdown";
import { EdgeComponent } from "../../components/Edge";
import { InfiniteScroll } from "../../components/InfiniteScroll";
import { NodeComponent } from "../../components/Node";
import { ItemIcons } from "../../components/common-icons";
import UpdateEdgeModal from "../../components/modals/edition/UpdateEdgeModal";
import UpdateNodeModal from "../../components/modals/edition/UpdateNodeModal";
import { getItemAttributes } from "../../core/appearance/utils";
import {
  useDynamicItemData,
  useFilteredGraph,
  useGraphDataset,
  useGraphDatasetActions,
  usePreferences,
  useSelection,
  useSelectionActions,
  useVisualGetters,
} from "../../core/context/dataContexts";
import {
  dynamicAttributes,
  mergeStaticDynamicData,
  staticDynamicAttributeLabel,
} from "../../core/graph/dynamicAttributes";
import { castScalarToModelValue } from "../../core/graph/fieldModel";
import { EdgeRenderingData, NodeRenderingData } from "../../core/graph/types";
import { useModal } from "../../core/modals";
import { focusCameraOnEdge, focusCameraOnNode } from "../../core/sigma";
import { DEFAULT_LINKIFY_PROPS } from "../../utils/url";

function SelectedItem<
  T extends { type: "nodes"; data: NodeRenderingData } | { type: "edges"; data: EdgeRenderingData },
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
  const { locale } = usePreferences();
  const { t } = useTranslation();
  const { openModal } = useModal();

  const graphDataset = useGraphDataset();

  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();
  const { deleteItems } = useGraphDatasetActions();
  const { select, unselect } = useSelectionActions();

  const attributes = useMemo(() => {
    const fields = type === "edges" ? graphDataset.edgeFields : graphDataset.nodeFields;

    return [
      { label: t(`graph.model.${type}-data.id`) as string, value: id },
      ...fields.map((field) => ({
        label: staticDynamicAttributeLabel(field),
        value: castScalarToModelValue(data.static[field.id], field),
      })),
      ...dynamicAttributes[type].map(({ field }) => ({
        label: staticDynamicAttributeLabel(field),
        value: castScalarToModelValue(data.dynamic[field.id], field),
      })),
      ...toPairs(renderingData).map(([field, value]) => ({ label: field, value })),
    ].filter(({ value }) => !isNil(value));
  }, [graphDataset.nodeFields, graphDataset.edgeFields, data, id, renderingData, t, type]);

  const item = getItemAttributes(type, id, filteredGraph, data, graphDataset, visualGetters);
  let content: ReactNode;
  if (type === "nodes") {
    content = <NodeComponent label={item.label} color={item.color} hidden={item.hidden} />;
  } else {
    const source = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.source(id),
      filteredGraph,
      data,
      graphDataset,
      visualGetters,
    );
    const target = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.target(id),
      filteredGraph,
      data,
      graphDataset,
      visualGetters,
    );

    content = <EdgeComponent {...item} source={source} target={target} className="mb-2" />;
  }

  useEffect(() => {
    // Close item if a new item has been added to the selection:
    // Open item if it is newly alone:
    setExpanded(initiallyExpanded);
  }, [initiallyExpanded]);

  return (
    <li className={`selected-${type}-item mt-2`}>
      <h4 className="fs-6 d-flex flex-row align-items-center mb-0">
        <div className="flex-grow-1 flex-shrink-1 text-ellipsis" title={item.label}>
          {content}
        </div>

        <button className="btn btn-sm ms-1 pe-0 flex-shrink-0" onClick={() => setExpanded(!expanded)}>
          {expanded ? <BsChevronUp /> : <BsChevronDown />}
        </button>

        <Dropdown
          options={[
            {
              label: (
                <>
                  <BiTargetLock className="me-2" />
                  {t(`selection.locate_on_graph`)}
                </>
              ),
              onClick: () => {
                if (type === "nodes") focusCameraOnNode(id);
                else focusCameraOnEdge(id);
              },
              disabled: item.hidden,
            },
            {
              label: (
                <>
                  <MdDeselect className="me-2" />
                  {t(`selection.unselect_${type}`)}
                </>
              ),
              onClick: () => unselect({ type, items: new Set([id]) }),
            },
            {
              label: (
                <>
                  <MdSelectAll className="me-2" />
                  {t(`selection.select_node_neighbors`)}
                </>
              ),
              onClick: () => {
                select({ type, items: new Set(filteredGraph.neighbors(id)), replace: false });
              },
              disabled: item.hidden,
            },
            {
              label: (
                <>
                  <MdFilterCenterFocus className="me-2" />
                  {t(`selection.focus_${type}`)}
                </>
              ),
              onClick: () => select({ type, items: new Set([id]), replace: true }),
              disabled: item.hidden || selectionSize === 1,
            },
            { type: "divider" },
            {
              label: (
                <>
                  <AiFillEdit className="me-2" />
                  {t(`edition.update_this_${type}`)}
                </>
              ),
              onClick: () =>
                type === "nodes"
                  ? openModal({ component: UpdateNodeModal, arguments: { nodeId: id } })
                  : openModal({ component: UpdateEdgeModal, arguments: { edgeId: id } }),
            },
            {
              label: (
                <>
                  <BsFillTrashFill className="me-2" />
                  {t(`edition.delete_this_${type}`)}
                </>
              ),
              onClick: () => {
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
              },
            },
          ]}
        >
          <button className="btn btn-sm flex-shrink-0">
            <BsThreeDotsVertical />
          </button>
        </Dropdown>
      </h4>
      <AnimateHeight height={expanded ? "auto" : 0} className="position-relative" duration={400}>
        <ul className="list-unstyled small">
          {attributes.map(({ label, value }) => (
            <li key={label} className="overflow-hidden">
              <div className="text-muted small text-break">{label}</div>{" "}
              <div className="mb-1 text-break">
                <ReactLinkify {...DEFAULT_LINKIFY_PROPS}>
                  {typeof value === "boolean"
                    ? value.toString()
                    : typeof value === "number"
                      ? value.toLocaleString(locale)
                      : value}
                </ReactLinkify>
              </div>
            </li>
          ))}
        </ul>
      </AnimateHeight>
    </li>
  );
}

export const Selection: FC = () => {
  const { t } = useTranslation();
  const { openModal } = useModal();

  const { type, items } = useSelection();
  const { select, reset } = useSelectionActions();
  const { nodeData, edgeData, nodeRenderingData, edgeRenderingData } = useGraphDataset();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const { deleteItems } = useGraphDatasetActions();
  const filteredGraph = useFilteredGraph();

  const mergedStaticDynamicItemData = useMemo(() => {
    return mergeStaticDynamicData(
      type === "nodes" ? nodeData : edgeData,
      type === "nodes" ? dynamicNodeData : dynamicEdgeData,
    );
  }, [nodeData, dynamicNodeData, dynamicEdgeData, edgeData, type]);

  const ItemIcon = ItemIcons[type];

  const isVisible =
    type === "nodes" ? filteredGraph.hasNode.bind(filteredGraph) : filteredGraph.hasEdge.bind(filteredGraph);
  const { visible = [], hidden = [] } = groupBy(Array.from(items), (item) => (isVisible(item) ? "visible" : "hidden"));

  return (
    <>
      <h3 className="fs-5 d-flex flex-row align-items-center mb-0">
        <div className="flex-grow-1 flex-shrink-1 text-ellipsis d-flex flex-row align-items-center ">
          <ItemIcon className="me-1" />
          {t(hidden.length ? `selection.visible_${type}` : `selection.${type}`, { count: visible.length })}
        </div>

        <Dropdown
          options={[
            {
              label: (
                <>
                  <MdSelectAll className="me-1" /> {t("selection.select_all")}
                </>
              ),
              onClick: () =>
                select({
                  type,
                  items: new Set<string>(type === "nodes" ? filteredGraph.nodes() : filteredGraph.edges()),
                }),
            },
            {
              label: (
                <>
                  <MdDeselect className="me-1" /> {t("selection.unselect_all")}
                </>
              ),
              onClick: () => reset(),
              disabled: !items.size,
            },
            { type: "divider" },
            {
              label: (
                <>
                  <BsFillTrashFill className="me-2" /> {t(`edition.delete_${type}`, { count: items.size })}
                </>
              ),
              onClick: () => {
                openModal({
                  component: ConfirmModal,
                  arguments: {
                    title: t(`edition.delete_${type}`, { count: 0 }),
                    message: t(`edition.confirm_delete_${type}`, { count: items.size }),
                  },
                  afterSubmit: () => {
                    deleteItems(type, Array.from(items));
                  },
                });
              },
              disabled: !items.size,
            },
          ]}
        >
          <button className="btn ms-1 pe-2 flex-shrink-0">
            <BsThreeDotsVertical />
          </button>
        </Dropdown>
      </h3>

      <ul className="list-unstyled">
        <InfiniteScroll
          pageSize={50}
          data={visible}
          scrollableTarget={"selection"}
          renderItem={(item) => (
            <SelectedItem
              id={item}
              key={item}
              type={type}
              selectionSize={items.size}
              data={mergedStaticDynamicItemData[item]}
              //TODO: add dynamic
              renderingData={type === "nodes" ? nodeRenderingData[item] : edgeRenderingData[item]}
            />
          )}
        />
      </ul>

      {!!hidden.length && (
        <>
          <hr />

          <h3 className="fs-5">
            <ItemIcon className="me-1" />
            {t(`selection.hidden_${type}`, { count: hidden.length })}
          </h3>

          <div>
            <button
              className="btn btn-sm btn-outline-dark mb-1"
              onClick={() => select({ type, items: new Set(visible), replace: true })}
              disabled={!items.size}
            >
              <MdDeselect className="me-1" /> {t(`selection.unselect_all_hidden_${type}`)}
            </button>
          </div>

          <ul className="list-unstyled">
            <InfiniteScroll
              scrollableTarget={"selection"}
              pageSize={50}
              data={hidden}
              renderItem={(item) => (
                <SelectedItem
                  id={item}
                  key={item}
                  type={type}
                  selectionSize={items.size}
                  data={mergedStaticDynamicItemData[item]}
                  renderingData={type === "nodes" ? nodeRenderingData[item] : edgeRenderingData[item]}
                />
              )}
            />
          </ul>
        </>
      )}
    </>
  );
};
