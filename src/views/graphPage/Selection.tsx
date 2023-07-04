import { groupBy, isNil, toPairs } from "lodash";
import { FC, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MdDeselect, MdSelectAll, MdFilterCenterFocus } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";

import {
  useFilteredGraph,
  useGraphDataset,
  useSelection,
  useSelectionActions,
  useVisualGetters,
} from "../../core/context/dataContexts";
import { NodeComponent } from "../../components/Node";
import { EdgeComponent } from "../../components/Edge";
import { ItemIcons } from "../../components/common-icons";
import { VisualGetters } from "../../core/appearance/types";
import { ItemData, GraphDataset, DatalessGraph, NodeRenderingData, EdgeRenderingData } from "../../core/graph/types";
import { DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR } from "../../core/appearance/utils";
import Dropdown from "../../components/Dropdown";
import { ItemType } from "../../core/types";

function getItemAttributes(
  type: ItemType,
  id: string,
  filteredGraph: DatalessGraph,
  graphDataset: GraphDataset,
  visualGetters: VisualGetters,
): { label: string | undefined; color: string; hidden?: boolean } {
  const data = type === "nodes" ? graphDataset.nodeData[id] : graphDataset.edgeData[id];
  const renderingData = type === "nodes" ? graphDataset.nodeRenderingData[id] : graphDataset.edgeRenderingData[id];
  const getLabel = type === "nodes" ? visualGetters.getNodeLabel : visualGetters.getEdgeLabel;
  const getColor = type === "nodes" ? visualGetters.getNodeColor : visualGetters.getEdgeColor;
  const defaultColor = type === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
  const hidden = type === "nodes" ? !filteredGraph.hasNode(id) : !filteredGraph.hasEdge(id);

  return {
    label: (getLabel ? getLabel(data) : renderingData.label) || undefined,
    color: getColor ? getColor(data, id) : renderingData.color || defaultColor,
    hidden,
  };
}

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
  const graphDataset = useGraphDataset();
  const visualGetters = useVisualGetters();
  const filteredGraph = useFilteredGraph();
  const { select, unselect } = useSelectionActions();
  const pairs = useMemo(
    () =>
      selectionSize === 1
        ? [[t(`selection.${type}_id`) as string, id], ...toPairs(data), ...toPairs(renderingData)].filter(
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
                  <MdDeselect className="me-2" /> {t(`selection.unselect_${type}`)}
                </>
              ),
              onClick: () => unselect({ type, items: new Set([id]) }),
            },
            {
              label: (
                <>
                  <MdFilterCenterFocus className="me-2" /> {t(`selection.focus_${type}`)}
                </>
              ),
              onClick: () => select({ type, items: new Set([id]), replace: true }),
              disabled: item.hidden || selectionSize === 1,
            },
          ]}
        >
          <button className="btn btn-sm btn-outline-dark ms-1 flex-shrink-0">
            <BsThreeDotsVertical />
          </button>
        </Dropdown>
      </h4>
      {pairs && (
        <ul className="ms-4 list-unstyled small">
          {pairs.map(([key, value], i) => (
            <li key={i}>
              <span className="text-muted">{key}:</span> {value}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export const Selection: FC = () => {
  const { t } = useTranslation();
  const { type, items } = useSelection();
  const { select, reset } = useSelectionActions();
  const { nodeData, edgeData, nodeRenderingData, edgeRenderingData } = useGraphDataset();
  const filteredGraph = useFilteredGraph();

  const ItemIcon = ItemIcons[type];

  const isVisible =
    type === "nodes" ? filteredGraph.hasNode.bind(filteredGraph) : filteredGraph.hasEdge.bind(filteredGraph);
  const { visible = [], hidden = [] } = groupBy(Array.from(items), (item) => (isVisible(item) ? "visible" : "hidden"));

  return (
    <>
      <h3 className="fs-5">
        <ItemIcon className="me-1" />
        {t(hidden.length ? `selection.visible_${type}` : `selection.${type}`, { count: visible.length })}
      </h3>

      <div>
        <button
          className="btn btn-sm btn-outline-dark mb-1 me-1"
          onClick={() =>
            select({ type, items: new Set<string>(type === "nodes" ? filteredGraph.nodes() : filteredGraph.edges()) })
          }
        >
          <MdSelectAll className="me-1" /> {t("selection.select_all")}
        </button>
        <button className="btn btn-sm btn-outline-dark mb-1" onClick={() => reset()} disabled={!items.size}>
          <MdDeselect className="me-1" /> {t("selection.unselect_all")}
        </button>
      </div>

      <ul className="list-unstyled">
        {visible.map((item) => (
          <SelectedItem
            key={item}
            id={item}
            type={type}
            selectionSize={items.size}
            data={type === "nodes" ? nodeData[item] : edgeData[item]}
            renderingData={type === "nodes" ? nodeRenderingData[item] : edgeRenderingData[item]}
          />
        ))}
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
            {hidden.map((item) => (
              <SelectedItem
                key={item}
                id={item}
                type={type}
                selectionSize={items.size}
                data={type === "nodes" ? nodeData[item] : edgeData[item]}
                renderingData={type === "nodes" ? nodeRenderingData[item] : edgeRenderingData[item]}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
};
