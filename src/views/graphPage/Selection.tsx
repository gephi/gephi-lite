import { FC } from "react";
import { useTranslation } from "react-i18next";
import { MdDeselect, MdSelectAll, MdFilterCenterFocus } from "react-icons/md";

import { ItemIcons } from "../../components/common-icons";
import {
  useFilteredGraph,
  useGraphDataset,
  useSelection,
  useSelectionActions,
  useSigmaGraph,
} from "../../core/context/dataContexts";
import { ItemType } from "../../core/types";
import { ItemData, EdgeRenderingData, NodeRenderingData } from "../../core/graph/types";
import { isEmpty, toPairs } from "lodash";
import { NodeComponent } from "../../components/Node";
import { EdgeComponent } from "../../components/Edge";

function SelectedItem<
  T extends { key: "nodes"; type: NodeRenderingData & ItemData } | { key: "edges"; type: EdgeRenderingData & ItemData },
>({ type, id, data, showProperties }: { type: ItemType; id: string; data: ItemData; showProperties?: boolean }) {
  const { t } = useTranslation();
  const sigmaGraph = useSigmaGraph();
  const { select, unselect } = useSelectionActions();
  const itemAttributes: T["type"] =
    type === "nodes" ? sigmaGraph.getNodeAttributes(id) : sigmaGraph.getEdgeAttributes(id);

  const sourceAttributes = type === "edges" ? sigmaGraph.getNodeAttributes(sigmaGraph.source(id)) : null;
  const targetAttributes = type === "edges" ? sigmaGraph.getNodeAttributes(sigmaGraph.target(id)) : null;

  return (
    <li className={`selected-${type}-item mt-2`}>
      <h4 className="fs-6 d-flex flex-row align-items-center">
        <div className="flex-grow-1 flex-shrink-1 text-ellipsis" title={itemAttributes.label || undefined}>
          {type === "nodes" ? (
            <NodeComponent label={itemAttributes.label} color={itemAttributes.color as string} />
          ) : (
            <EdgeComponent
              label={itemAttributes.label}
              color={itemAttributes.color as string}
              source={{
                label: sourceAttributes!.label,
                color: sourceAttributes!.color as string,
              }}
              target={{
                label: targetAttributes!.label,
                color: targetAttributes!.color as string,
              }}
            />
          )}
        </div>

        <button
          title={t(`selection.unselect_${type}`) as string}
          className="btn btn-sm btn-outline-dark ms-1 flex-shrink-0"
          onClick={() => unselect({ type, items: new Set([id]) })}
        >
          <MdDeselect />
        </button>
        <button
          title={t(`selection.focus_${type}`) as string}
          className="btn btn-sm btn-outline-dark ms-1 flex-shrink-0"
          onClick={() => select({ type, items: new Set([id]), replace: true })}
        >
          <MdFilterCenterFocus />
        </button>
      </h4>
      {showProperties &&
        (!isEmpty(data) ? (
          <ul className="ms-4 list-unstyled">
            {toPairs(data).map(([key, value]) => (
              <li key={key}>
                <span className="text-muted">{key}:</span> {value}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted fst-italic">{t(`selection.empty_${type}`)}</span>
        ))}
    </li>
  );
}

export const Selection: FC = () => {
  const { t } = useTranslation();
  const { type, items } = useSelection();
  const { select, reset } = useSelectionActions();
  const { nodeData, edgeData } = useGraphDataset();
  const filteredGraph = useFilteredGraph();

  const ItemIcon = ItemIcons[type];

  return (
    <>
      <h3 className="fs-5">
        <ItemIcon className="me-1" />
        {t(`selection.${type}`, { count: items.size })}
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

      <ul className="list-unstyled mt-4">
        {Array.from(items).map((item) => (
          <SelectedItem
            key={item}
            id={item}
            type={type}
            data={type === "nodes" ? nodeData[item] : edgeData[item]}
            showProperties={items.size === 1}
          />
        ))}
      </ul>
    </>
  );
};
