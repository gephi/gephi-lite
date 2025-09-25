import { DEFAULT_NODE_COLOR, FieldModel, NodeCoordinates, Scalar, StaticDynamicItemData } from "@gephi/gephi-lite-sdk";
import { groupBy, isNil, toPairs, values } from "lodash";
import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import AnimateHeight from "react-animate-height";
import { Trans, useTranslation } from "react-i18next";
import { PiChecks } from "react-icons/pi";
import { useNavigate } from "react-router";

import Dropdown from "../../components/Dropdown";
import { InfiniteScroll } from "../../components/InfiniteScroll";
import {
  CaretDownIcon,
  CaretUpIcon,
  FieldModelIcon,
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
import { useModal } from "../../core/modals";
import { focusCameraOnEdge, focusCameraOnNode } from "../../core/sigma";

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
  const { deleteItems } = useGraphDatasetActions();
  const { select, unselect } = useSelectionActions();

  const attributes = useMemo<{ label: ReactNode; value: Scalar; field?: FieldModel }[]>(
    () => [
      { label: t(`graph.model.${type}-data.id`), value: id },
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
    ],
    [data.dynamic, data.static, fields, id, renderingData, t, type],
  );

  const item = getItemAttributes(type, id, filteredGraph, data, graphDataset, visualGetters);
  let content: ReactNode;
  if (type === "nodes") {
    content = <NodeComponent label={item.label} color={item.color} hidden={item.hidden} />;
  } else {
    //if edge is filtered out, use nodeData to compute rendering data and not sigmaGraph
    const mergedStaticDynamicNodeData =
      !item.hidden && sigmaGraph.hasEdge(id) ? {} : mergeStaticDynamicData(nodeData, dynamicNodeData);

    const source =
      !item.hidden && sigmaGraph.hasEdge(id)
        ? sigmaGraph.getNodeAttributes(sigmaGraph.source(id))
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
        ? sigmaGraph.getNodeAttributes(sigmaGraph.target(id))
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
        <div className="flex-grow-1 flex-shrink-1 text-ellipsis" title={item.label}>
          {content}
        </div>

        <button className="gl-btn gl-btn-icon" onClick={() => setExpanded(!expanded)}>
          {expanded ? <CaretUpIcon /> : <CaretDownIcon />}
        </button>

        <Dropdown
          options={[
            {
              label: t(`selection.locate_on_graph`),
              onClick: () => {
                if (type === "nodes") focusCameraOnNode(id);
                else focusCameraOnEdge(id);
              },
              disabled: item.hidden,
            },
            {
              label: t(`selection.unselect_${type}`),
              onClick: () => unselect({ type, items: new Set([id]) }),
            },
            {
              label: t(`selection.select_node_neighbors`),
              onClick: () => {
                select({ type, items: new Set(filteredGraph.neighbors(id)), replace: false });
              },
              disabled: item.hidden,
            },
            {
              label: t(`selection.focus_${type}`),
              onClick: () => select({ type, items: new Set([id]), replace: true }),
              disabled: item.hidden || selectionSize === 1,
            },
            { type: "divider" },
            {
              label: t(`edition.update_this_${type}`),
              onClick: () =>
                type === "nodes"
                  ? openModal({ component: EditNodeModal, arguments: { nodeId: id } })
                  : openModal({ component: EditEdgeModal, arguments: { edgeId: id } }),
            },
            {
              label: t(`edition.delete_this_${type}`),
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
          <button className="gl-btn gl-btn-icon">
            <ThreeDotsVerticalIcon />
          </button>
        </Dropdown>
      </h4>
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
  const { type, items } = useSelection();
  const { select } = useSelectionActions();
  const { showSelection } = useDataTableActions();
  const { deleteItems } = useGraphDatasetActions();
  const filteredGraph = useFilteredGraph();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const { nodeData, edgeData, layout } = useGraphDataset();

  const mergedStaticDynamicItemData = useMemo(() => {
    return mergeStaticDynamicData(
      type === "nodes" ? nodeData : edgeData,
      type === "nodes" ? dynamicNodeData : dynamicEdgeData,
    );
  }, [nodeData, dynamicNodeData, dynamicEdgeData, edgeData, type]);

  const { visible = [], hidden = [] } = useMemo(() => {
    const isVisible =
      type === "nodes" ? filteredGraph.hasNode.bind(filteredGraph) : filteredGraph.hasEdge.bind(filteredGraph);
    return groupBy(Array.from(items), (item) => (isVisible(item) ? "visible" : "hidden"));
  }, [filteredGraph, items, type]);

  return (
    <>
      {/* Selection main list */}
      <div className="panel-body gap-1">
        {!!hidden.length && (
          <div>
            <Trans i18nKey={`selection.visible_${type}`} count={visible.length} />
          </div>
        )}
        <ul className="list-unstyled gl-m-0 gl-gap-1">
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
                renderingData={type === "nodes" ? layout[item] : {}}
              />
            )}
          />
        </ul>

        {/* Selection hidden list (should actually never be visible) */}
        {!!hidden.length && (
          <>
            <hr />
            <div>
              <Trans i18nKey={`selection.hidden_${type}`} count={hidden.length} />
            </div>
            <ul className="list-unstyled gl-m-0 gl-gap-1">
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
                    renderingData={type === "nodes" ? layout[item] : {}}
                  />
                )}
              />
            </ul>
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
              navigate(`/data/${type}`);
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
