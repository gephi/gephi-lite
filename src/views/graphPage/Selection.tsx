import { groupBy, isNil, toPairs } from "lodash";
import { FC, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AiFillEdit } from "react-icons/ai";
import { BiTargetLock } from "react-icons/bi";
import { BsFillTrashFill, BsThreeDotsVertical } from "react-icons/bs";
import { MdDeselect, MdFilterCenterFocus, MdSelectAll } from "react-icons/md";

import ReactLinkify from "react-linkify";
import Dropdown from "../../components/Dropdown";
import { EdgeComponent } from "../../components/Edge";
import { InfiniteScroll } from "../../components/InfiniteScroll";
import { NodeComponent } from "../../components/Node";
import { ItemIcons } from "../../components/common-icons";
import { getItemAttributes } from "../../core/appearance/utils";
import {
  useFilteredGraph,
  useGraphDataset,
  useGraphDatasetActions,
  useSelection,
  useSelectionActions,
  useVisualGetters,
} from "../../core/context/dataContexts";
import { EdgeRenderingData, ItemData, NodeRenderingData } from "../../core/graph/types";
import { useModal } from "../../core/modals";
import { focusCameraOnEdge, focusCameraOnNode } from "../../core/sigma";
import { DEFAULT_LINKIFY_PROPS } from "../../utils/url";
import ConfirmModal from "./modals/ConfirmModal";
import UpdateEdgeModal from "./modals/edition/UpdateEdgeModal";
import UpdateNodeModal from "./modals/edition/UpdateNodeModal";

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
  data: ItemData;
  renderingData: T["data"];
  selectionSize?: number;
}) {
  const { t } = useTranslation();
  const { openModal } = useModal();

  const graphDataset = useGraphDataset();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();
  const { deleteItems } = useGraphDatasetActions();
  const { select, unselect } = useSelectionActions();
  const attributes = useMemo(
    () =>
      selectionSize === 1
        ? [[t(`graph.model.${type}-data.id`) as string, id], ...toPairs(data), ...toPairs(renderingData)].filter(
            ([, value]) => !isNil(value),
          )
        : null,
    [data, id, renderingData, selectionSize, t, type],
  );

  const item = getItemAttributes(type, id, filteredGraph, graphDataset, visualGetters);
  let content: ReactNode;
  if (type === "nodes") {
    content = <NodeComponent label={item.label} color={item.color} hidden={item.hidden} />;
  } else {
    const source = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.source(id),
      filteredGraph,
      graphDataset,
      visualGetters,
    );
    const target = getItemAttributes(
      "nodes",
      graphDataset.fullGraph.target(id),
      filteredGraph,
      graphDataset,
      visualGetters,
    );

    content = <EdgeComponent {...item} source={source} target={target} />;
  }

  return (
    <li className={`selected-${type}-item mt-2`}>
      <h4 className="fs-6 d-flex flex-row align-items-center mb-0">
        <div className="flex-grow-1 flex-shrink-1 text-ellipsis" title={item.label}>
          {content}
        </div>

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
          <button className="btn btn-sm ms-1 flex-shrink-0">
            <BsThreeDotsVertical />
          </button>
        </Dropdown>
      </h4>
      {attributes && (
        <ul className="ms-4 list-unstyled small">
          {attributes.map(([key, value], i) => (
            <li key={i}>
              <span className="text-muted">{key}:</span> <ReactLinkify {...DEFAULT_LINKIFY_PROPS}>{value}</ReactLinkify>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export const Selection: FC = () => {
  const { t } = useTranslation();
  const { openModal } = useModal();

  const { type, items } = useSelection();
  const { select, reset } = useSelectionActions();
  const { nodeData, edgeData, nodeRenderingData, edgeRenderingData } = useGraphDataset();
  const { deleteItems } = useGraphDatasetActions();
  const filteredGraph = useFilteredGraph();

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
              data={type === "nodes" ? nodeData[item] : edgeData[item]}
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
                  data={type === "nodes" ? nodeData[item] : edgeData[item]}
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
