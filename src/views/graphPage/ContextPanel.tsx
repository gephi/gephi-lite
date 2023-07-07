import { FC, useCallback } from "react";
import { capitalize } from "lodash";
import { useTranslation } from "react-i18next";
import { AiOutlinePlus } from "react-icons/ai";

import { Selection } from "./Selection";
import { GraphSearch, Option, OptionItem } from "../../components/GraphSearch";
import { ContextIcon } from "../../components/common-icons";
import { useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import { ItemType } from "../../core/types";
import { useModal } from "../../core/modals";
import { useSelectionActions } from "../../core/context/dataContexts";
import UpdateNodeModal from "./modals/edition/UpdateNodeModal";
import UpdateEdgeModal from "./modals/edition/UpdateEdgeModal";

const GraphStat: FC<{ type: ItemType; current: number; total: number }> = ({ type, current, total }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();

  return (
    <div className="d-flex flex-row mb-2">
      <span className="fs-5 flex-grow-1">
        {capitalize(t(`graph.model.${type}`) as string) + ":"} {current}
        {current !== total && (
          <>
            <span className="small">
              /{total}
              <span className="ms-2 text-muted">({((current / total) * 100).toFixed(0)}%)</span>
            </span>
          </>
        )}
      </span>
      <button
        className="btn btn-outline-dark btn-sm ms-1 flex-shrink-0"
        title={t(`edition.create_${type}`) as string}
        onClick={() =>
          type === "nodes"
            ? openModal({
                component: UpdateNodeModal,
                arguments: {},
              })
            : openModal({
                component: UpdateEdgeModal,
                arguments: {},
              })
        }
      >
        <AiOutlinePlus />
      </button>
    </div>
  );
};

const RESULT_MAX_SIZE = 25;

const GraphSelectionSearch: FC = () => {
  const { select } = useSelectionActions();

  const onChange = useCallback(
    (option: Option | null) => {
      if (option) {
        if (option.type === "message") {
          if (option.action) option.action();
        } else {
          select({ type: option.type, items: new Set([option.id]) });
        }
      }
    },
    [select],
  );

  const postProcessOptions = useCallback(
    (searchResult: Option[]) => {
      const result: Option[] = searchResult.slice(0, RESULT_MAX_SIZE - 1);

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

      return result;
    },
    [select],
  );

  return <GraphSearch value={null} onChange={onChange} postProcessOptions={postProcessOptions} />;
};

export const ContextPanel: FC = () => {
  const { t } = useTranslation();
  const { fullGraph } = useGraphDataset();
  const filteredGraph = useFilteredGraph();

  return (
    <>
      <div className="panel-block">
        <h2 className="fs-4">
          <ContextIcon className="me-1" />
          {t("context.title")}
        </h2>
      </div>
      <hr className="m-0" />

      <div className="panel-block">
        <GraphStat type="nodes" current={filteredGraph.order} total={fullGraph.order} />
        <GraphStat type="edges" current={filteredGraph.size} total={fullGraph.size} />
      </div>
      <hr className="m-0" />

      <div className="panel-block">
        <GraphSelectionSearch />
      </div>
      <hr className="m-0" />

      <div className="panel-block-grow">
        <Selection />
      </div>
    </>
  );
};
