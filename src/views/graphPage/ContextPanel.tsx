import { FC } from "react";
import { capitalize } from "lodash";
import { useTranslation } from "react-i18next";
import { AiOutlinePlus } from "react-icons/ai";

import { Selection } from "./Selection";
import { GraphSearch } from "../../components/GraphSearch";
import { ContextIcon } from "../../components/common-icons";
import { useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import { ItemType } from "../../core/types";
import { useModal } from "../../core/modals";
import CreateNodeModal from "./modals/edition/CreateNodeModal";
import CreateEdgeModal from "./modals/edition/CreateEdgeModal";

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
        onClick={() => {
          openModal(
            type === "nodes"
              ? {
                  component: CreateNodeModal,
                  arguments: {},
                }
              : {
                  component: CreateEdgeModal,
                  arguments: {},
                },
          );
        }}
      >
        <AiOutlinePlus />
      </button>
    </div>
  );
};

export const ContextPanel: FC = () => {
  const { t } = useTranslation();
  const { fullGraph, metadata } = useGraphDataset();
  const filteredGraph = useFilteredGraph();

  return (
    <>
      <h2 className="fs-4">
        <ContextIcon className="me-1" />
        {metadata.title || t("context.title")}
      </h2>
      <hr />

      <GraphStat type="nodes" current={filteredGraph.order} total={fullGraph.order} />
      <GraphStat type="edges" current={filteredGraph.size} total={fullGraph.size} />
      <hr />

      <GraphSearch />
      <hr />

      <Selection />
    </>
  );
};
